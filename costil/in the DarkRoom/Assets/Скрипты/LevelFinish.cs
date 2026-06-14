using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.Events;
using System.Collections;

public class LevelFinish : MonoBehaviour
{
    [Header("Finish Settings")]
    [Tooltip("Название сцены для загрузки после завершения")]
    public string nextSceneName = "MainMenu";
    [Tooltip("Время ожидания перед загрузкой следующей сцены (сек)")]
    public float delayBeforeLoad = 2f;
    [Tooltip("Тег игрока для определения касания")]
    public string playerTag = "Player";
    
    [Header("Actions to Execute")]
    [Tooltip("События, которые выполнятся при завершении уровня (как в кнопке)")]
    public UnityEvent onFinishEvents;
    
    [Header("Objects Control")]
    [Tooltip("Объекты, которые нужно включить при завершении")]
    public GameObject[] objectsToEnable;
    [Tooltip("Объекты, которые нужно выключить при завершении")]
    public GameObject[] objectsToDisable;
    
    [Header("Audio Settings")]
    [Tooltip("Звук при завершении уровня")]
    public AudioClip finishSound;
    [Tooltip("Громкость звука")]
    [Range(0f, 1f)]
    public float soundVolume = 0.7f;
    
    [Header("Visual Effects")]
    [Tooltip("Эффект при завершении уровня")]
    public GameObject finishEffect;
    [Tooltip("Отключить ли игрока при завершении")]
    public bool disablePlayerOnFinish = true;
    [Tooltip("Остановить ли движение игрока")]
    public bool stopPlayerMovement = true;
    
    [Header("UI Settings")]
    [Tooltip("Показать ли курсор после завершения")]
    public bool showCursorOnFinish = true;
    [Tooltip("Заблокировать ли курсор после завершения")]
    public CursorLockMode cursorLockMode = CursorLockMode.None;
    
    private bool isFinished = false;
    private AudioSource audioSource;
    private GameObject player;
    private PlayerMovement playerMovement;
    
    private void Start()
    {
        SetupAudioSource();
    }
    
    private void SetupAudioSource()
    {
        audioSource = GetComponent<AudioSource>();
        if (audioSource == null)
        {
            audioSource = gameObject.AddComponent<AudioSource>();
        }
        audioSource.playOnAwake = false;
        audioSource.volume = soundVolume;
    }
    
    private void OnTriggerEnter(Collider other)
    {
        if (isFinished) return;
        
        if (other.CompareTag(playerTag))
        {
            player = other.gameObject;
            playerMovement = player.GetComponent<PlayerMovement>();
            FinishLevel();
        }
    }
    
    private void FinishLevel()
    {
        isFinished = true;
        
        Debug.Log("Уровень завершён! Запуск финальной последовательности...");
        
        // Воспроизводим звук
        PlaySound(finishSound);
        
        // Спавним визуальный эффект
        SpawnFinishEffect();
        
        // Включаем/выключаем объекты
        ToggleObjects();
        
        // Отключаем управление игроком
        DisablePlayer();
        
        // Вызываем события из инспектора
        if (onFinishEvents != null)
        {
            onFinishEvents.Invoke();
            Debug.Log("Вызваны события завершения");
        }
        
        // Настраиваем курсор
        SetupCursor();
        
        // Запускаем задержку перед загрузкой сцены
        StartCoroutine(LoadNextSceneWithDelay());
    }
    
    private void ToggleObjects()
    {
        // Включаем указанные объекты
        if (objectsToEnable != null)
        {
            foreach (GameObject obj in objectsToEnable)
            {
                if (obj != null)
                {
                    obj.SetActive(true);
                    Debug.Log($"Включён объект: {obj.name}");
                }
            }
        }
        
        // Выключаем указанные объекты
        if (objectsToDisable != null)
        {
            foreach (GameObject obj in objectsToDisable)
            {
                if (obj != null)
                {
                    obj.SetActive(false);
                    Debug.Log($"Выключён объект: {obj.name}");
                }
            }
        }
    }
    
    private void DisablePlayer()
    {
        if (player == null) return;
        
        if (disablePlayerOnFinish)
        {
            player.SetActive(false);
        }
        
        if (stopPlayerMovement && playerMovement != null)
        {
            playerMovement.enabled = false;
            
            Rigidbody rb = player.GetComponent<Rigidbody>();
            if (rb != null)
            {
                rb.linearVelocity = Vector3.zero;
                rb.angularVelocity = Vector3.zero;
                rb.isKinematic = true;
            }
            
            UnityEngine.AI.NavMeshAgent agent = player.GetComponent<UnityEngine.AI.NavMeshAgent>();
            if (agent != null)
            {
                agent.isStopped = true;
                agent.velocity = Vector3.zero;
            }
        }
    }
    
    private void SpawnFinishEffect()
    {
        if (finishEffect != null)
        {
            GameObject effect = Instantiate(finishEffect, transform.position, Quaternion.identity);
            Destroy(effect, 2f);
        }
    }
    
    private void PlaySound(AudioClip clip)
    {
        if (clip != null && audioSource != null)
        {
            audioSource.PlayOneShot(clip, soundVolume);
        }
    }
    
    private void SetupCursor()
    {
        if (showCursorOnFinish)
        {
            Cursor.visible = true;
            Cursor.lockState = cursorLockMode;
        }
    }
    
    private IEnumerator LoadNextSceneWithDelay()
    {
        yield return new WaitForSeconds(delayBeforeLoad);
        
        if (string.IsNullOrEmpty(nextSceneName))
        {
            Debug.LogError("LevelFinish: Не указано имя следующей сцены!");
            yield break;
        }
        
        SceneManager.LoadScene(nextSceneName);
        Debug.Log($"Загрузка сцены: {nextSceneName}");
    }
    
    /// <summary>
    /// Пропустить ожидание и сразу загрузить следующую сцену
    /// </summary>
    public void SkipDelayAndLoad()
    {
        if (isFinished)
        {
            StopAllCoroutines();
            SceneManager.LoadScene(nextSceneName);
        }
    }
    
    /// <summary>
    /// Проверить, завершён ли уровень
    /// </summary>
    public bool IsFinished()
    {
        return isFinished;
    }
}