using UnityEngine;
using UnityEngine.SceneManagement;

public class SimpleMenuManager : MonoBehaviour
{
    [Header("Scene Settings")]
    public string gameSceneName = "Game";
    
    /// <summary>
    /// Начать игру
    /// </summary>
    public void StartGame()
    {
        SceneManager.LoadScene(gameSceneName);
    }
    
    /// <summary>
    /// Выйти из игры
    /// </summary>
    public void QuitGame()
    {
        #if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
        #else
            Application.Quit();
        #endif
    }
}