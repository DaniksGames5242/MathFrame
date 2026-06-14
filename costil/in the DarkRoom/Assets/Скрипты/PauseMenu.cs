using UnityEngine;
using UnityEngine.SceneManagement;

public class PauseMenu : MonoBehaviour
{
    [Header("Pause Menu Settings")]
    [Tooltip("Canvas или GameObject с меню паузы")]
    public GameObject pauseMenuPanel;
    [Tooltip("Клавиша для открытия/закрытия меню паузы")]
    public KeyCode pauseKey = KeyCode.Escape;
    [Tooltip("Показывать ли курсор при открытии меню")]
    public bool showCursorOnPause = true;
    [Tooltip("Блокировать ли курсор при закрытии меню")]
    public bool lockCursorOnResume = true;
    
    [Header("Audio Settings")]
    [Tooltip("Звук при открытии меню паузы")]
    public AudioClip pauseOpenSound;
    [Tooltip("Звук при закрытии меню паузы")]
    public AudioClip pauseCloseSound;
    [Tooltip("Громкость звуков паузы")]
    [Range(0f, 1f)]
    public float pauseSoundVolume = 0.7f;
    
    [Header("Button Actions")]
    [Tooltip("Название сцены для выхода в главное меню")]
    public string mainMenuSceneName = "MainMenu";
    
    private bool isPaused = false;
    private AudioSource audioSource;
    private CursorLockMode previousLockMode;
    private bool previousCursorVisibility;
    
    private void Start()
    {
        SetupAudioSource();
        
        // Убеждаемся, что меню паузы скрыто при старте
        if (pauseMenuPanel != null)
        {
            pauseMenuPanel.SetActive(false);
        }
        
        isPaused = false;
        Time.timeScale = 1f;
        
        // Настройка курсора для начала игры
        if (lockCursorOnResume)
        {
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }
    }
    
    private void SetupAudioSource()
    {
        audioSource = GetComponent<AudioSource>();
        if (audioSource == null)
        {
            audioSource = gameObject.AddComponent<AudioSource>();
        }
        
        audioSource.playOnAwake = false;
        audioSource.volume = pauseSoundVolume;
    }
    
    private void Update()
    {
        // Проверка нажатия клавиши паузы
        if (Input.GetKeyDown(pauseKey))
        {
            if (isPaused)
            {
                ResumeGame();
            }
            else
            {
                PauseGame();
            }
        }
    }
    
    /// <summary>
    /// Открыть меню паузы и остановить игру
    /// </summary>
    public void PauseGame()
    {
        if (isPaused) return;
        
        isPaused = true;
        
        // Останавливаем время
        Time.timeScale = 0f;
        
        // Показываем меню паузы
        if (pauseMenuPanel != null)
        {
            pauseMenuPanel.SetActive(true);
        }
        
        // Настраиваем курсор
        previousLockMode = Cursor.lockState;
        previousCursorVisibility = Cursor.visible;
        
        if (showCursorOnPause)
        {
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
        }
        
        // Воспроизводим звук открытия
        PlaySound(pauseOpenSound);
        
        Debug.Log("Игра на паузе");
    }
    
    /// <summary>
    /// Закрыть меню паузы и продолжить игру
    /// </summary>
    public void ResumeGame()
    {
        if (!isPaused) return;
        
        isPaused = false;
        
        // Возвращаем время
        Time.timeScale = 1f;
        
        // Скрываем меню паузы
        if (pauseMenuPanel != null)
        {
            pauseMenuPanel.SetActive(false);
        }
        
        // Восстанавливаем курсор
        if (lockCursorOnResume)
        {
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }
        else
        {
            Cursor.lockState = previousLockMode;
            Cursor.visible = previousCursorVisibility;
        }
        
        // Воспроизводим звук закрытия
        PlaySound(pauseCloseSound);
        
        Debug.Log("Игра продолжена");
    }
    
    /// <summary>
    /// Выйти в главное меню
    /// </summary>
    public void QuitToMainMenu()
    {
        // Возвращаем время перед загрузкой новой сцены
        Time.timeScale = 1f;
        
        // Воспроизводим звук
        PlaySound(pauseCloseSound);
        
        // Загружаем главное меню
        SceneManager.LoadScene(mainMenuSceneName);
        
        Debug.Log("Выход в главное меню");
    }
    
    /// <summary>
    /// Выйти из игры (полностью)
    /// </summary>
    public void QuitGame()
    {
        // Возвращаем время
        Time.timeScale = 1f;
        
        // Воспроизводим звук
        PlaySound(pauseCloseSound);
        
        Debug.Log("Выход из игры");
        
        #if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
        #else
            Application.Quit();
        #endif
    }
    
    /// <summary>
    /// Перезапустить текущий уровень
    /// </summary>
    public void RestartLevel()
    {
        // Возвращаем время
        Time.timeScale = 1f;
        
        // Воспроизводим звук
        PlaySound(pauseCloseSound);
        
        // Перезагружаем текущую сцену
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
        
        Debug.Log("Перезапуск уровня");
    }
    
    /// <summary>
    /// Проверить, открыто ли меню паузы
    /// </summary>
    public bool IsPaused()
    {
        return isPaused;
    }
    
    private void PlaySound(AudioClip clip)
    {
        if (clip != null && audioSource != null)
        {
            audioSource.PlayOneShot(clip, pauseSoundVolume);
        }
    }
    
    private void OnDestroy()
    {
        // Убеждаемся, что время восстановлено при уничтожении скрипта
        Time.timeScale = 1f;
    }
}