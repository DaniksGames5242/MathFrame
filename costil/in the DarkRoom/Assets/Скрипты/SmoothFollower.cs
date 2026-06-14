using UnityEngine;

public class SmoothFollower : MonoBehaviour
{
    [Header("Target Settings")]
    public Transform target;

    [Header("Position Settings")]
    public float smoothPositionSpeed = 5f;
    public float positionDelay = 0f;

    [Header("Rotation Settings")]
    public float smoothRotationSpeed = 5f;
    public float rotationDelay = 0f;

    [Header("Offset")]
    public Vector3 positionOffset = Vector3.zero;
    public Vector3 rotationOffset = Vector3.zero;

    [Header("Light Control")]
    public Light targetLight;
    public float lightIntensityOn = 1f;
    public float lightIntensityOff = 0f;
    public float lightSmoothSpeed = 5f;

    [Header("Toggle Activation")]
    public KeyCode toggleKey = KeyCode.F;
    public bool startActive = true;

    [Header("Audio Settings")]
    public AudioClip enableSound;
    public AudioClip disableSound;
    [Range(0f, 1f)]
    public float soundVolume = 1f;
    [Tooltip("Источник звука (если не указан, будет создан автоматически)")]
    public AudioSource customAudioSource;

    [Header("Monster Alert")]
    public bool alertMonsterOnToggle = true;
    public float toggleSoundRadius = 15f;
    public float toggleSoundIntensity = 0.8f;

    private float positionTimer = 0f;
    private float rotationTimer = 0f;
    private bool canMovePosition = false;
    private bool canRotate = false;

    private Vector3 targetPosition;
    private Quaternion targetRotation;
    
    private bool isLightOn;
    private float targetIntensity;
    private AudioSource audioSource;
    private Light foundLight;
    private NavMeshMonster monster;

    private void Awake()
    {
        SetupLight();
        SetupAudioSource();
        isLightOn = startActive;
    }

    private void Start()
    {
        if (target == null)
        {
            GameObject player = GameObject.FindGameObjectWithTag("Player");
            if (player != null) target = player.transform;
        }
        
        FindMonster();
        
        positionTimer = positionDelay;
        rotationTimer = rotationDelay;
        canMovePosition = positionDelay <= 0;
        canRotate = rotationDelay <= 0;
        
        InitializeLightState();
    }
    
    private void SetupLight()
    {
        if (targetLight == null)
        {
            targetLight = GetComponent<Light>();
            if (targetLight == null) targetLight = GetComponentInChildren<Light>();
        }
    }
    
    private void SetupAudioSource()
    {
        if (customAudioSource != null)
        {
            audioSource = customAudioSource;
        }
        else
        {
            audioSource = GetComponent<AudioSource>();
            if (audioSource == null)
                audioSource = gameObject.AddComponent<AudioSource>();
        }
        
        audioSource.playOnAwake = false;
        audioSource.volume = soundVolume;
    }
    
    private void InitializeLightState()
    {
        if (targetLight == null) return;
        
        if (startActive)
        {
            targetLight.intensity = lightIntensityOn;
            targetIntensity = lightIntensityOn;
            isLightOn = true;
        }
        else
        {
            targetLight.intensity = lightIntensityOff;
            targetIntensity = lightIntensityOff;
            isLightOn = false;
        }
        targetLight.enabled = true;
    }
    
    private void FindMonster()
    {
        GameObject monsterObj = GameObject.FindGameObjectWithTag("Monster");
        if (monsterObj != null)
            monster = monsterObj.GetComponent<NavMeshMonster>();
    }
    
    private void SendSoundToMonster(float intensity)
    {
        if (monster != null && alertMonsterOnToggle)
            monster.HearSound(transform.position, intensity, false);
    }
    
    private void PlaySound(AudioClip clip)
    {
        if (clip != null && audioSource != null)
            audioSource.PlayOneShot(clip, soundVolume);
    }

    private void Update()
    {
        if (Input.GetKeyDown(toggleKey)) ToggleLight();
        
        if (targetLight != null && Mathf.Abs(targetLight.intensity - targetIntensity) > 0.01f)
        {
            targetLight.intensity = Mathf.Lerp(targetLight.intensity, targetIntensity, lightSmoothSpeed * Time.deltaTime);
        }
        
        if (!isLightOn || target == null) return;

        if (!canMovePosition)
        {
            if (positionTimer > 0) positionTimer -= Time.deltaTime;
            else canMovePosition = true;
        }

        if (!canRotate)
        {
            if (rotationTimer > 0) rotationTimer -= Time.deltaTime;
            else canRotate = true;
        }
    }

    private void FixedUpdate()
    {
        if (!isLightOn || target == null) return;

        targetPosition = target.TransformPoint(positionOffset);
        targetRotation = target.rotation * Quaternion.Euler(rotationOffset);

        if (canMovePosition)
            transform.position = Vector3.Lerp(transform.position, targetPosition, smoothPositionSpeed * Time.fixedDeltaTime);

        if (canRotate)
            transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, smoothRotationSpeed * Time.fixedDeltaTime);
    }
    
    public void ToggleLight()
    {
        isLightOn = !isLightOn;
        
        if (isLightOn)
        {
            targetIntensity = lightIntensityOn;
            PlaySound(enableSound);
            SendSoundToMonster(toggleSoundIntensity);
            ResetDelays();
            TeleportToTarget();
        }
        else
        {
            targetIntensity = lightIntensityOff;
            PlaySound(disableSound);
            SendSoundToMonster(toggleSoundIntensity);
        }
    }
    
    public void EnableLight()
    {
        if (!isLightOn) ToggleLight();
    }
    
    public void DisableLight()
    {
        if (isLightOn) ToggleLight();
    }
    
    public void ResetDelays()
    {
        positionTimer = positionDelay;
        rotationTimer = rotationDelay;
        canMovePosition = positionDelay <= 0;
        canRotate = rotationDelay <= 0;
    }

    public void TeleportToTarget()
    {
        if (target == null) return;
        transform.position = target.TransformPoint(positionOffset);
        transform.rotation = target.rotation * Quaternion.Euler(rotationOffset);
        canMovePosition = true;
        canRotate = true;
    }
    
    public bool IsLightOn() => isLightOn;
    
    public void AlertMonster(float customIntensity = -1f)
    {
        SendSoundToMonster(customIntensity > 0 ? customIntensity : toggleSoundIntensity);
    }
}