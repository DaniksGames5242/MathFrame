using UnityEngine;
using System.Collections.Generic;

public class DecalPainter : MonoBehaviour
{
    [Header("Decal Settings")]
    [Tooltip("Префаб декали для спавна")]
    public GameObject decalPrefab;
    [Tooltip("Клавиша для нанесения декали")]
    public KeyCode paintKey = KeyCode.E;
    [Tooltip("Максимальное расстояние для нанесения декали")]
    public float maxDistance = 5f;
    [Tooltip("Максимальное количество декалей на сцене")]
    public int maxDecals = 30;
    [Tooltip("Время жизни декали (если 0 - бесконечно)")]
    public float decalLifetime = 0f;
    [Tooltip("Смещение декали по вертикали (чтобы не было Z-fighting)")]
    public float decalHeightOffset = 0.01f;
    
    [Header("Cooldown Settings")]
    [Tooltip("Время перезарядки между нанесениями (сек)")]
    public float cooldownTime = 2f;
    
    [Header("Layer Settings")]
    [Tooltip("Слои, на которые можно наносить декали (только пол)")]
    public LayerMask groundLayers = -1;
    
    [Header("Audio Settings")]
    [Tooltip("Звук при нанесении декали")]
    public AudioClip paintSound;
    [Tooltip("Громкость звука")]
    [Range(0f, 1f)]
    public float soundVolume = 0.7f;
    
    [Header("Visual Effects")]
    [Tooltip("Эффект при нанесении декали (опционально)")]
    public GameObject paintEffect;
    
    private Camera playerCamera;
    private AudioSource audioSource;
    private List<GameObject> decalsList = new List<GameObject>();
    private float lastPaintTime = -999f;
    
    private void Start()
    {
        SetupComponents();
    }
    
    private void SetupComponents()
    {
        playerCamera = Camera.main;
        if (playerCamera == null)
        {
            playerCamera = GetComponentInChildren<Camera>();
            if (playerCamera == null)
            {
                Debug.LogError("DecalPainter: Не найдена камера! Добавьте тег 'MainCamera' на камеру игрока.");
            }
        }
        
        audioSource = GetComponent<AudioSource>();
        if (audioSource == null)
        {
            audioSource = gameObject.AddComponent<AudioSource>();
        }
        audioSource.playOnAwake = false;
        audioSource.volume = soundVolume;
    }
    
    private void Update()
    {
        if (Input.GetKeyDown(paintKey))
        {
            TryPaintDecal();
        }
    }
    
    private void TryPaintDecal()
    {
        // Проверка перезарядки
        if (Time.time - lastPaintTime < cooldownTime)
        {
            Debug.Log($"Перезарядка: {(cooldownTime - (Time.time - lastPaintTime)):F1} сек");
            return;
        }
        
        // Луч из центра камеры
        Ray ray = playerCamera.ScreenPointToRay(new Vector3(Screen.width / 2f, Screen.height / 2f, 0f));
        RaycastHit hit;
        
        // Проверка попадания
        if (Physics.Raycast(ray, out hit, maxDistance, groundLayers))
        {
            // Проверяем, что это пол (а не стена) - смотрим на нормаль
            // Если нормаль направлена вверх (Y > 0.7) - это пол
            if (hit.normal.y > 0.7f)
            {
                PaintDecal(hit);
                lastPaintTime = Time.time;
            }
            else
            {
                Debug.Log("Можно наносить декали только на пол!");
            }
        }
        else
        {
            Debug.Log($"Слишком далеко или нет поверхности (макс. расстояние: {maxDistance})");
        }
    }
    
    private void PaintDecal(RaycastHit hit)
    {
        // Вычисляем позицию для декали (на уровне пола + небольшое смещение)
        Vector3 decalPosition = new Vector3(hit.point.x, hit.point.y + decalHeightOffset, hit.point.z);
        
        // Поворот декали: X = 90°, Y = случайный (0-360), Z = 0
        float randomY = Random.Range(0f, 360f);
        Quaternion decalRotation = Quaternion.Euler(90f, randomY, 0f);
        
        // Создаём декаль
        GameObject newDecal = Instantiate(decalPrefab, decalPosition, decalRotation);
        
        // Добавляем в список
        decalsList.Add(newDecal);
        
        // Воспроизводим звук
        PlaySound(paintSound);
        
        // Воспроизводим визуальный эффект
        SpawnPaintEffect(hit);
        
        // Если декаль имеет ограниченное время жизни
        if (decalLifetime > 0)
        {
            Destroy(newDecal, decalLifetime);
        }
        
        // Проверяем лимит декалей
        CheckDecalsLimit();
        
        Debug.Log($"Декаль нанесена! Поворот: X=90, Y={randomY:F1}, Z=0. Всего декалей: {decalsList.Count}");
    }
    
    private void SpawnPaintEffect(RaycastHit hit)
    {
        if (paintEffect != null)
        {
            GameObject effect = Instantiate(paintEffect, hit.point, Quaternion.identity);
            Destroy(effect, 1f);
        }
    }
    
    private void PlaySound(AudioClip clip)
    {
        if (clip != null && audioSource != null)
        {
            audioSource.PlayOneShot(clip, soundVolume);
        }
    }
    
    private void CheckDecalsLimit()
    {
        // Если превышен лимит, удаляем самые старые декали
        while (decalsList.Count > maxDecals && decalsList.Count > 0)
        {
            GameObject oldestDecal = decalsList[0];
            decalsList.RemoveAt(0);
            Destroy(oldestDecal);
            
            Debug.Log($"Удалена старая декаль. Текущее количество: {decalsList.Count}");
        }
    }
    
    /// <summary>
    /// Очистить все декали со сцены
    /// </summary>
    public void ClearAllDecals()
    {
        foreach (GameObject decal in decalsList)
        {
            if (decal != null)
                Destroy(decal);
        }
        decalsList.Clear();
        Debug.Log("Все декали очищены");
    }
    
    /// <summary>
    /// Получить текущее количество декалей
    /// </summary>
    public int GetDecalCount()
    {
        return decalsList.Count;
    }
    
    /// <summary>
    /// Удалить декаль по индексу
    /// </summary>
    public void RemoveDecal(int index)
    {
        if (index >= 0 && index < decalsList.Count && decalsList[index] != null)
        {
            Destroy(decalsList[index]);
            decalsList.RemoveAt(index);
        }
    }
}