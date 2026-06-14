using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

public class AdvancedAutoFocusDOF : MonoBehaviour
{
    [Header("Focus Settings")]
    [Tooltip("Объект, на который фокусироваться (игрок)")]
    public Transform target;
    [Tooltip("Скорость автофокусировки")]
    public float focusSpeed = 5f;
    [Tooltip("Минимальная дистанция фокуса")]
    public float minFocusDistance = 0.5f;
    [Tooltip("Максимальная дистанция фокуса")]
    public float maxFocusDistance = 50f;
    [Tooltip("Базовая дистанция фокуса (если нет цели)")]
    public float defaultFocusDistance = 10f;
    
    [Header("Raycast Settings")]
    [Tooltip("Слои, которые учитываются при автофокусе")]
    public LayerMask focusLayers = -1;
    [Tooltip("Максимальная дистанция луча")]
    public float raycastDistance = 30f;
    [Tooltip("Смещение луча от центра экрана")]
    public Vector2 raycastOffset = Vector2.zero;
    [Tooltip("Задержка перед сбросом фокуса (если ничего не в центре)")]
    public float focusResetDelay = 1.5f;
    
    [Header("DOF Quality Settings")]
    [Tooltip("Качество размытия (чем выше, тем лучше, но тяжелее)")]
    [Range(1, 4)]
    public int blurQuality = 2;
    [Tooltip("Диафрагма (чем меньше, тем сильнее размытие)")]
    [Range(0.1f, 32f)]
    public float aperture = 5.6f;
    [Tooltip("Фокусное расстояние")]
    [Range(1f, 300f)]
    public float focalLength = 50f;
    
    [Header("Dynamic Settings")]
    [Tooltip("Усиливать размытие при приближении к объекту")]
    public bool enhanceBlurOnApproach = true;
    [Tooltip("Коэффициент усиления размытия при приближении")]
    [Range(0f, 2f)]
    public float approachBlurMultiplier = 1f;
    
    [Header("Debug")]
    [Tooltip("Показывать луч в Scene View")]
    public bool showDebugRay = true;
    [Tooltip("Цвет луча при отладке")]
    public Color debugRayColor = Color.green;
    [Tooltip("Показывать GUI информацию")]
    public bool showDebugGUI = false;
    
    private Volume volume;
    private DepthOfField depthOfField;
    private float currentFocusDistance;
    private float targetFocusDistance;
    private Camera playerCamera;
    private float lastHitTime;
    private bool hasHit = false;
    
    // Для сглаживания
    private float velocity = 0f;
    private float originalAperture;
    private float originalFocalLength;
    
    private void Start()
    {
        SetupComponents();
        FindTarget();
        SaveOriginalSettings();
    }
    
    private void SetupComponents()
    {
        playerCamera = GetComponent<Camera>();
        if (playerCamera == null)
        {
            playerCamera = Camera.main;
            if (playerCamera == null)
            {
                Debug.LogError("AdvancedAutoFocusDOF: Не найдена камера!");
                return;
            }
        }
        
        volume = playerCamera.GetComponent<Volume>();
        if (volume == null)
        {
            volume = playerCamera.gameObject.AddComponent<Volume>();
        }
        
        if (volume.profile == null)
        {
            volume.profile = ScriptableObject.CreateInstance<VolumeProfile>();
        }
        
        if (!volume.profile.TryGet(out depthOfField))
        {
            depthOfField = volume.profile.Add<DepthOfField>();
        }
        
        depthOfField.active = true;
        depthOfField.mode.value = DepthOfFieldMode.Bokeh;
        depthOfField.focusDistance.value = defaultFocusDistance;
        depthOfField.aperture.value = aperture;
        depthOfField.focalLength.value = focalLength;
        
        // Note: blurSampleCount doesn't exist in newer URP versions
        // Quality is now controlled by other settings or removed
        // You can set high quality filter instead if needed
        if (blurQuality >= 3)
        {
            // In some URP versions you might have:
            // depthOfField.highQualityFiltering.value = true;
        }
        
        currentFocusDistance = defaultFocusDistance;
        targetFocusDistance = defaultFocusDistance;
    }
    
    private void SaveOriginalSettings()
    {
        if (depthOfField != null)
        {
            originalAperture = depthOfField.aperture.value;
            originalFocalLength = depthOfField.focalLength.value;
        }
    }
    
    private void FindTarget()
    {
        if (target == null)
        {
            GameObject playerObj = GameObject.FindGameObjectWithTag("Player");
            if (playerObj != null)
            {
                target = playerObj.transform;
                Debug.Log("AdvancedAutoFocusDOF: Цель найдена по тегу 'Player'");
            }
        }
    }
    
    private void Update()
    {
        if (playerCamera == null) return;
        
        UpdateTargetFocusDistance();
        
        currentFocusDistance = Mathf.SmoothDamp(
            currentFocusDistance, 
            targetFocusDistance, 
            ref velocity, 
            1f / focusSpeed,
            Mathf.Infinity,
            Time.deltaTime
        );
        
        if (depthOfField != null)
        {
            depthOfField.focusDistance.value = currentFocusDistance;
            
            // Динамическое изменение размытия при приближении
            if (enhanceBlurOnApproach && hasHit)
            {
                float distanceToFocus = currentFocusDistance;
                float t = Mathf.Clamp01(distanceToFocus / raycastDistance);
                float blurFactor = 1f + (1f - t) * approachBlurMultiplier;
                depthOfField.aperture.value = Mathf.Clamp(originalAperture * blurFactor, 0.1f, 32f);
            }
            else
            {
                depthOfField.aperture.value = originalAperture;
            }
        }
    }
    
    private void UpdateTargetFocusDistance()
    {
        if (target == null)
        {
            targetFocusDistance = defaultFocusDistance;
            return;
        }
        
        Vector2 screenCenter = new Vector2(
            Screen.width / 2f + raycastOffset.x,
            Screen.height / 2f + raycastOffset.y
        );
        
        Ray ray = playerCamera.ScreenPointToRay(screenCenter);
        RaycastHit hit;
        
        if (showDebugRay)
        {
            Debug.DrawRay(ray.origin, ray.direction * raycastDistance, debugRayColor);
        }
        
        if (Physics.Raycast(ray, out hit, raycastDistance, focusLayers))
        {
            lastHitTime = Time.time;
            hasHit = true;
            
            float distance = Vector3.Distance(playerCamera.transform.position, hit.point);
            targetFocusDistance = Mathf.Clamp(distance, minFocusDistance, maxFocusDistance);
        }
        else
        {
            // Сброс фокуса через задержку
            if (Time.time - lastHitTime > focusResetDelay)
            {
                hasHit = false;
                float distanceToTarget = Vector3.Distance(playerCamera.transform.position, target.position);
                targetFocusDistance = Mathf.Clamp(distanceToTarget, minFocusDistance, maxFocusDistance);
            }
        }
    }
    
    public void SetFocusDistance(float distance)
    {
        targetFocusDistance = Mathf.Clamp(distance, minFocusDistance, maxFocusDistance);
    }
    
    public void SetFocusDistanceInstant(float distance)
    {
        targetFocusDistance = Mathf.Clamp(distance, minFocusDistance, maxFocusDistance);
        currentFocusDistance = targetFocusDistance;
        if (depthOfField != null)
        {
            depthOfField.focusDistance.value = currentFocusDistance;
        }
    }
    
    public void SetDOFEnabled(bool enabled)
    {
        if (depthOfField != null)
        {
            depthOfField.active = enabled;
        }
    }
    
    public void SetDOFMode(DepthOfFieldMode mode)
    {
        if (depthOfField != null)
        {
            depthOfField.mode.value = mode;
        }
    }
    
    public float GetCurrentFocusDistance()
    {
        return currentFocusDistance;
    }
    
    private void OnGUI()
    {
        if (!showDebugGUI) return;
        
        GUIStyle style = new GUIStyle();
        style.normal.textColor = Color.white;
        style.fontSize = 14;
        style.fontStyle = FontStyle.Bold;
        
        GUILayout.BeginArea(new Rect(10, 10, 300, 200));
        GUILayout.Label($"DOF Focus Distance: {currentFocusDistance:F1}m", style);
        GUILayout.Label($"Target Distance: {targetFocusDistance:F1}m", style);
        GUILayout.Label($"Has Target: {(target != null ? target.name : "None")}", style);
        GUILayout.Label($"Has Hit: {hasHit}", style);
        GUILayout.Label($"DOF Active: {(depthOfField != null && depthOfField.active)}", style);
        GUILayout.EndArea();
    }
    
    private void OnDrawGizmosSelected()
    {
        if (!showDebugRay || playerCamera == null) return;
        
        Vector2 screenCenter = new Vector2(
            Screen.width / 2f + raycastOffset.x,
            Screen.height / 2f + raycastOffset.y
        );
        
        Ray ray = playerCamera.ScreenPointToRay(screenCenter);
        
        Gizmos.color = debugRayColor;
        Gizmos.DrawRay(ray.origin, ray.direction * raycastDistance);
        
        Gizmos.color = Color.red;
        Vector3 focusPoint = ray.origin + ray.direction * currentFocusDistance;
        Gizmos.DrawWireSphere(focusPoint, 0.3f);
    }
}