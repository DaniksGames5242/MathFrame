using UnityEngine;
using System.Collections;
using System.Collections.Generic;

[RequireComponent(typeof(AudioSource))]
public class PlayerFootstepSounds : MonoBehaviour
{
    [Header("Footstep Settings")]
    [SerializeField] private LayerMask groundLayers = -1;
    [SerializeField] private float footstepInterval = 0.5f;
    [SerializeField] private float runFootstepInterval = 0.3f;
    [SerializeField] private float crouchFootstepInterval = 0.7f;
    [SerializeField] private float minSpeedForFootsteps = 1f;
    
    [Header("Landing Settings")]
    [SerializeField] private float minLandingVelocity = 3f;
    [SerializeField] private float maxLandingVelocity = 15f;
    [SerializeField] private AnimationCurve landingVolumeCurve = AnimationCurve.Linear(0, 0, 1, 1);
    [SerializeField] private float landingPitchVariation = 0.2f;
    
    [Header("Audio Sources")]
    [SerializeField] private AudioSource footstepSource;
    [SerializeField] private AudioSource landingSource;
    
    [Header("Monster Hearing")]
    [SerializeField] private float footstepSoundRadius = 20f;
    [SerializeField] private float landingSoundRadius = 30f;
    [SerializeField] private float footstepBaseIntensity = 0.7f;
    [SerializeField] private float landingBaseIntensity = 0.9f;
    
    [System.Serializable]
    public class SurfaceSoundSet
    {
        public PhysicsMaterial material;
        public AudioClip[] footstepClips;
        public AudioClip landingClip;
        [Range(0f, 1f)] public float volumeMultiplier = 1f;
        [Range(0.5f, 2f)] public float pitchBase = 1f;
        public float pitchVariation = 0.1f;
    }
    
    [SerializeField] private SurfaceSoundSet[] surfaceSounds;
    
    private PlayerMovement playerMovement;
    private PlayerCamera playerCamera;
    private NavMeshMonster monster;
    
    private float footstepTimer = 0f;
    private bool wasGrounded = true;
    private float lastVerticalVelocity;
    
    private Dictionary<PhysicsMaterial, SurfaceSoundSet> soundMap;
    private bool isEnabled = true;
    private float currentFootstepInterval;
    private bool hasErrors = false;

    private void Awake()
    {
        // Инициализация с защитой от ошибок
        InitializeComponents();
        SetupAudioSources();
        BuildSoundMap();
        
        // Включаем скрипт при старте
        isEnabled = true;
        currentFootstepInterval = footstepInterval;
        footstepTimer = 0f;
        
        Debug.Log("PlayerFootstepSounds: Скрипт инициализирован");
    }
    
    private void Start()
    {
        // Отложенный поиск монстра
        StartCoroutine(FindMonsterWithDelay());
        Debug.Log("PlayerFootstepSounds: Start выполнен");
    }
    
    private void OnEnable()
    {
        isEnabled = true;
        footstepTimer = 0f;
        Debug.Log("PlayerFootstepSounds: Скрипт включён");
    }
    
    private void OnDisable()
    {
        Debug.Log("PlayerFootstepSounds: Скрипт выключен - проверьте ошибки выше");
    }
    
    private void InitializeComponents()
    {
        // Поиск PlayerMovement с защитой от ошибок
        if (playerMovement == null)
        {
            playerMovement = GetComponent<PlayerMovement>();
            if (playerMovement == null)
            {
                playerMovement = GetComponentInParent<PlayerMovement>();
            }
            if (playerMovement == null)
            {
                Debug.LogWarning("PlayerFootstepSounds: PlayerMovement не найден! Звуки шагов не будут работать.");
                hasErrors = true;
            }
        }
        
        // Поиск PlayerCamera (опционально)
        if (playerCamera == null)
        {
            playerCamera = GetComponentInChildren<PlayerCamera>();
            if (playerCamera == null)
            {
                Debug.Log("PlayerFootstepSounds: PlayerCamera не найден (не критично)");
            }
        }
    }
    
    private void SetupAudioSources()
    {
        try
        {
            if (footstepSource == null)
            {
                footstepSource = GetComponent<AudioSource>();
                if (footstepSource == null)
                    footstepSource = gameObject.AddComponent<AudioSource>();
            }
            
            if (landingSource == null)
            {
                landingSource = gameObject.AddComponent<AudioSource>();
                landingSource.playOnAwake = false;
            }
            
            if (footstepSource != null)
            {
                footstepSource.spatialBlend = 1f;
                footstepSource.playOnAwake = false;
            }
            
            if (landingSource != null)
            {
                landingSource.spatialBlend = 1f;
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"PlayerFootstepSounds: Ошибка настройки аудио - {e.Message}");
            hasErrors = true;
        }
    }
    
    private IEnumerator FindMonsterWithDelay()
    {
        // Ждём немного для инициализации сцены
        yield return new WaitForSeconds(0.5f);
        
        // Поиск монстра
        GameObject monsterObj = GameObject.FindGameObjectWithTag("Monster");
        if (monsterObj != null)
        {
            monster = monsterObj.GetComponent<NavMeshMonster>();
            if (monster != null)
                Debug.Log("PlayerFootstepSounds: Монстр найден!");
            else
                Debug.Log("PlayerFootstepSounds: Компонент NavMeshMonster не найден на объекте с тегом Monster");
        }
        else
        {
            Debug.Log("PlayerFootstepSounds: Монстр не найден в сцене (это нормально, если его ещё нет)");
        }
    }
    
    private void BuildSoundMap()
    {
        soundMap = new Dictionary<PhysicsMaterial, SurfaceSoundSet>();
        if (surfaceSounds != null)
        {
            foreach (var set in surfaceSounds)
            {
                if (set != null && set.material != null && !soundMap.ContainsKey(set.material))
                    soundMap.Add(set.material, set);
            }
        }
        
        if (soundMap.Count == 0)
        {
            Debug.LogWarning("PlayerFootstepSounds: Не настроены звуки поверхностей! Добавьте SurfaceSoundSet в инспекторе.");
        }
    }
    
    private void Update()
    {
        // Если есть ошибки - пропускаем логику
        if (hasErrors) return;
        if (!isEnabled) return;
        if (playerMovement == null) return;
        
        try
        {
            bool isGrounded = false;
            float verticalVelocity = 0f;
            float currentSpeed = 0f;
            bool isActuallyMoving = false;
            bool isOnLadder = false;
            bool isCrouching = false;
            
            // Безопасное получение параметров
            try
            {
                isGrounded = playerMovement.IsGrounded();
                verticalVelocity = playerMovement.GetVerticalVelocity();
                currentSpeed = playerMovement.GetCurrentSpeed();
                isActuallyMoving = playerMovement.IsActuallyMoving();
                isOnLadder = playerMovement.IsOnLadder();
                isCrouching = playerMovement.IsCrouching();
            }
            catch (System.Exception e)
            {
                Debug.LogError($"PlayerFootstepSounds: Ошибка получения параметров PlayerMovement - {e.Message}");
                hasErrors = true;
                return;
            }
            
            // Обработка приземления
            if (isGrounded && !wasGrounded)
            {
                float fallSpeed = Mathf.Abs(lastVerticalVelocity);
                if (fallSpeed > minLandingVelocity)
                {
                    PlayLandingSound(fallSpeed);
                    SendSoundToMonster(landingSoundRadius, landingBaseIntensity, isCrouching);
                }
            }
            
            wasGrounded = isGrounded;
            lastVerticalVelocity = verticalVelocity;
            
            // Обновление интервала шагов
            UpdateFootstepInterval();
            
            // Логика шагов
            if (isGrounded && currentSpeed > minSpeedForFootsteps && isActuallyMoving && !isOnLadder)
            {
                if (footstepTimer <= 0f)
                {
                    PlayFootstepSound();
                    SendSoundToMonster(footstepSoundRadius, footstepBaseIntensity, isCrouching);
                    footstepTimer = currentFootstepInterval;
                }
                else
                {
                    footstepTimer -= Time.deltaTime;
                }
            }
            else
            {
                footstepTimer = 0f;
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"PlayerFootstepSounds: Критическая ошибка в Update - {e.Message}");
            hasErrors = true;
        }
    }
    
    private void UpdateFootstepInterval()
    {
        if (playerMovement == null) return;
        
        try
        {
            if (playerMovement.IsRunning())
            {
                currentFootstepInterval = runFootstepInterval;
            }
            else if (playerMovement.IsCrouching())
            {
                currentFootstepInterval = crouchFootstepInterval;
            }
            else
            {
                currentFootstepInterval = footstepInterval;
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"PlayerFootstepSounds: Ошибка в UpdateFootstepInterval - {e.Message}");
        }
    }
    
    private void SendSoundToMonster(float maxRadius, float baseIntensity, bool isCrouching)
    {
        if (monster == null) return;
        if (isCrouching) return;
        if (playerMovement == null) return;
        
        try
        {
            float currentSpeed = playerMovement.GetCurrentSpeed();
            float maxSpeed = playerMovement.GetRunSpeed();
            float speedFactor = Mathf.Clamp01(currentSpeed / maxSpeed);
            
            float soundIntensity = baseIntensity * speedFactor;
            
            monster.HearSound(transform.position, soundIntensity, isCrouching);
        }
        catch (System.Exception e)
        {
            Debug.LogWarning($"PlayerFootstepSounds: Ошибка отправки звука монстру - {e.Message}");
        }
    }
    
    private void PlayFootstepSound()
    {
        if (!isEnabled) return;
        if (footstepSource == null) return;
        
        try
        {
            PhysicsMaterial groundMaterial = GetGroundMaterial();
            SurfaceSoundSet soundSet = GetSoundSetForMaterial(groundMaterial);
            
            if (soundSet == null || soundSet.footstepClips == null || soundSet.footstepClips.Length == 0)
            {
                // Пробуем использовать дефолтный звук
                if (surfaceSounds != null && surfaceSounds.Length > 0 && surfaceSounds[0] != null && surfaceSounds[0].footstepClips != null && surfaceSounds[0].footstepClips.Length > 0)
                {
                    soundSet = surfaceSounds[0];
                }
                else
                {
                    return;
                }
            }
            
            AudioClip clip = soundSet.footstepClips[Random.Range(0, soundSet.footstepClips.Length)];
            
            float pitch = soundSet.pitchBase + Random.Range(-soundSet.pitchVariation, soundSet.pitchVariation);
            float volume = soundSet.volumeMultiplier;
            
            if (playerMovement != null)
            {
                float speedRatio = Mathf.Clamp01(playerMovement.GetCurrentSpeed() / playerMovement.GetRunSpeed());
                volume *= Mathf.Lerp(0.7f, 1.2f, speedRatio);
            }
            
            footstepSource.pitch = pitch;
            footstepSource.PlayOneShot(clip, volume);
        }
        catch (System.Exception e)
        {
            Debug.LogWarning($"PlayerFootstepSounds: Ошибка воспроизведения шага - {e.Message}");
        }
    }
    
    private void PlayLandingSound(float fallSpeed)
    {
        if (!isEnabled) return;
        if (landingSource == null) return;
        
        try
        {
            PhysicsMaterial groundMaterial = GetGroundMaterial();
            SurfaceSoundSet soundSet = GetSoundSetForMaterial(groundMaterial);
            
            if (soundSet == null || soundSet.landingClip == null)
                return;
            
            float t = Mathf.Clamp01((fallSpeed - minLandingVelocity) / (maxLandingVelocity - minLandingVelocity));
            float volume = landingVolumeCurve.Evaluate(t) * soundSet.volumeMultiplier;
            
            float pitch = soundSet.pitchBase + Random.Range(-landingPitchVariation, landingPitchVariation);
            
            landingSource.pitch = pitch;
            landingSource.PlayOneShot(soundSet.landingClip, volume);
        }
        catch (System.Exception e)
        {
            Debug.LogWarning($"PlayerFootstepSounds: Ошибка воспроизведения приземления - {e.Message}");
        }
    }
    
    private PhysicsMaterial GetGroundMaterial()
    {
        if (playerMovement == null) return null;
        
        try
        {
            RaycastHit hit;
            Vector3 origin = transform.position + Vector3.up * 0.1f;
            
            if (Physics.Raycast(origin, Vector3.down, out hit, 0.5f, groundLayers))
            {
                Collider hitCollider = hit.collider;
                if (hitCollider != null && hitCollider.sharedMaterial != null)
                    return hitCollider.sharedMaterial;
            }
        }
        catch (System.Exception e)
        {
            Debug.LogWarning($"PlayerFootstepSounds: Ошибка получения материала поверхности - {e.Message}");
        }
        
        return null;
    }
    
    private SurfaceSoundSet GetSoundSetForMaterial(PhysicsMaterial material)
    {
        if (material == null || soundMap == null)
            return GetDefaultSoundSet();
        
        if (soundMap.ContainsKey(material))
            return soundMap[material];
        
        return GetDefaultSoundSet();
    }
    
    private SurfaceSoundSet GetDefaultSoundSet()
    {
        if (surfaceSounds != null && surfaceSounds.Length > 0)
            return surfaceSounds[0];
        return null;
    }
    
    public void SetEnabled(bool enabled)
    {
        isEnabled = enabled;
        if (!isEnabled)
        {
            if (footstepSource != null && footstepSource.isPlaying)
                footstepSource.Stop();
            if (landingSource != null && landingSource.isPlaying)
                landingSource.Stop();
            footstepTimer = 0f;
        }
        else
        {
            footstepTimer = 0f;
            hasErrors = false; // Сбрасываем флаг ошибок при включении
        }
        Debug.Log($"PlayerFootstepSounds: SetEnabled({enabled})");
    }
    
    // Для отладки - можно вызвать из инспектора
    public void ForceEnable()
    {
        isEnabled = true;
        hasErrors = false;
        Debug.Log("PlayerFootstepSounds: Принудительное включение");
    }
}