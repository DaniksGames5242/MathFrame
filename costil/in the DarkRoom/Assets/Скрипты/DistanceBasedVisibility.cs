using UnityEngine;
using System.Collections.Generic;

public class OptimizedDistanceVisibility : MonoBehaviour
{
    [Header("Основные настройки")]
    [Tooltip("Игрок")]
    public Transform player;
    
    [Tooltip("Дистанция видимости")]
    public float visibilityDistance = 30f;
    
    [Header("Объекты для управления")]
    [Tooltip("Массив объектов (можно до 10000+)")]
    public GameObject[] objectsToManage;
    
    [Header("Настройки оптимизации")]
    [Tooltip("Размер ячейки сетки (больше = меньше проверок, но хуже точность)")]
    public float cellSize = 20f;
    
    [Tooltip("Обновлять только при движении игрока (экономит CPU)")]
    public bool updateOnlyOnPlayerMove = true;
    
    [Tooltip("Минимальное движение игрока для обновления")]
    public float playerMoveThreshold = 1f;
    
    [Tooltip("Распределять обновление по кадрам")]
    public bool asyncUpdate = true;
    
    [Tooltip("Количество объектов для проверки за кадр")]
    public int objectsPerFrame = 50;
    
    [Header("Отладка")]
    public bool showDebugLogs = false;
    public bool drawDebugGrid = true;
    
    // Оптимизированное хранилище
    private Dictionary<Vector2Int, List<GameObject>> spatialGrid;
    private Dictionary<GameObject, bool> currentVisibility;
    private Vector3 lastPlayerPosition;
    private Vector2Int lastPlayerCell;
    private int currentFrameIndex = 0;
    private bool needsUpdate = true;
    private List<GameObject> allObjectsList;
    
    void Start()
    {
        Initialize();
    }
    
    void Initialize()
    {
        // Поиск игрока
        if (player == null)
        {
            GameObject playerObj = GameObject.FindGameObjectWithTag("Player");
            if (playerObj != null)
                player = playerObj.transform;
            else
                Debug.LogError("Player не найден!");
        }
        
        if (objectsToManage == null || objectsToManage.Length == 0)
        {
            Debug.LogWarning("Нет объектов для управления!");
            return;
        }
        
        // Очищаем массив от null
        List<GameObject> validObjects = new List<GameObject>();
        foreach (var obj in objectsToManage)
        {
            if (obj != null)
                validObjects.Add(obj);
        }
        objectsToManage = validObjects.ToArray();
        allObjectsList = new List<GameObject>(objectsToManage);
        
        // Инициализация
        spatialGrid = new Dictionary<Vector2Int, List<GameObject>>();
        currentVisibility = new Dictionary<GameObject, bool>();
        
        // Заполняем пространственную сетку
        BuildSpatialGrid();
        
        // Инициализация состояния видимости
        foreach (var obj in objectsToManage)
        {
            currentVisibility[obj] = true; // По умолчанию видим
        }
        
        lastPlayerPosition = player.position;
        lastPlayerCell = GetCellIndex(lastPlayerPosition);
        
        if (showDebugLogs)
            Debug.Log($"Инициализация завершена. Объектов: {objectsToManage.Length}, Ячеек: {spatialGrid.Count}");
        
        // Первое обновление
        UpdateVisibilityAsync();
    }
    
    void BuildSpatialGrid()
    {
        spatialGrid.Clear();
        
        foreach (var obj in objectsToManage)
        {
            if (obj == null) continue;
            
            Vector2Int cellIndex = GetCellIndex(obj.transform.position);
            
            if (!spatialGrid.ContainsKey(cellIndex))
                spatialGrid[cellIndex] = new List<GameObject>();
            
            spatialGrid[cellIndex].Add(obj);
        }
        
        if (showDebugLogs)
            Debug.Log($"Построена сетка {spatialGrid.Count} ячеек");
    }
    
    Vector2Int GetCellIndex(Vector3 position)
    {
        return new Vector2Int(
            Mathf.FloorToInt(position.x / cellSize),
            Mathf.FloorToInt(position.z / cellSize)
        );
    }
    
    void Update()
    {
        if (player == null || objectsToManage.Length == 0)
            return;
        
        bool shouldUpdate = true;
        
        if (updateOnlyOnPlayerMove)
        {
            float distanceMoved = Vector3.Distance(player.position, lastPlayerPosition);
            if (distanceMoved >= playerMoveThreshold)
            {
                lastPlayerPosition = player.position;
                shouldUpdate = true;
            }
            else
            {
                shouldUpdate = false;
            }
        }
        
        if (shouldUpdate)
        {
            Vector2Int currentCell = GetCellIndex(player.position);
            
            if (currentCell != lastPlayerCell || !updateOnlyOnPlayerMove)
            {
                lastPlayerCell = currentCell;
                needsUpdate = true;
            }
        }
        
        if (needsUpdate)
        {
            if (asyncUpdate)
                UpdateVisibilityAsync();
            else
                UpdateVisibilityImmediate();
        }
    }
    
    void UpdateVisibilityImmediate()
    {
        // Получаем все ячейки в радиусе видимости
        int radiusInCells = Mathf.CeilToInt(visibilityDistance / cellSize) + 1;
        HashSet<Vector2Int> visibleCells = GetCellsInRadius(lastPlayerCell, radiusInCells);
        
        // Собираем все объекты в видимых ячейках
        HashSet<GameObject> visibleObjects = new HashSet<GameObject>();
        foreach (var cell in visibleCells)
        {
            if (spatialGrid.TryGetValue(cell, out List<GameObject> objectsInCell))
            {
                foreach (var obj in objectsInCell)
                {
                    visibleObjects.Add(obj);
                }
            }
        }
        
        // Применяем изменения
        ApplyVisibilityChanges(visibleObjects);
        
        needsUpdate = false;
        
        if (showDebugLogs)
            Debug.Log($"Обновлено: видимых {visibleObjects.Count}/{objectsToManage.Length}");
    }
    
    void UpdateVisibilityAsync()
    {
        StartCoroutine(AsyncVisibilityUpdate());
    }
    
    System.Collections.IEnumerator AsyncVisibilityUpdate()
    {
        // Получаем все ячейки в радиусе видимости
        int radiusInCells = Mathf.CeilToInt(visibilityDistance / cellSize) + 1;
        HashSet<Vector2Int> visibleCells = GetCellsInRadius(lastPlayerCell, radiusInCells);
        
        // Собираем все объекты в видимых ячейках
        HashSet<GameObject> visibleObjects = new HashSet<GameObject>();
        
        foreach (var cell in visibleCells)
        {
            if (spatialGrid.TryGetValue(cell, out List<GameObject> objectsInCell))
            {
                foreach (var obj in objectsInCell)
                {
                    visibleObjects.Add(obj);
                }
            }
            
            yield return null; // Даём время другим процессам
        }
        
        // Применяем изменения батчами
        yield return ApplyVisibilityChangesAsync(visibleObjects);
        
        needsUpdate = false;
        
        if (showDebugLogs)
            Debug.Log($"Асинхронное обновление завершено. Видимых: {visibleObjects.Count}");
    }
    
    HashSet<Vector2Int> GetCellsInRadius(Vector2Int centerCell, int radius)
    {
        HashSet<Vector2Int> cells = new HashSet<Vector2Int>();
        
        for (int x = -radius; x <= radius; x++)
        {
            for (int y = -radius; y <= radius; y++)
            {
                Vector2Int cell = new Vector2Int(centerCell.x + x, centerCell.y + y);
                
                // Проверяем, находится ли ячейка в радиусе видимости
                float cellCenterX = cell.x * cellSize;
                float cellCenterZ = cell.y * cellSize;
                float distanceToCell = Vector2.Distance(
                    new Vector2(player.position.x, player.position.z),
                    new Vector2(cellCenterX, cellCenterZ)
                );
                
                if (distanceToCell <= visibilityDistance + cellSize)
                {
                    cells.Add(cell);
                }
            }
        }
        
        return cells;
    }
    
    void ApplyVisibilityChanges(HashSet<GameObject> visibleObjects)
    {
        // Скрываем объекты, которых нет в visibleObjects
        foreach (var obj in objectsToManage)
        {
            if (obj == null) continue;
            
            bool shouldBeVisible = visibleObjects.Contains(obj);
            
            if (currentVisibility[obj] != shouldBeVisible)
            {
                obj.SetActive(shouldBeVisible);
                currentVisibility[obj] = shouldBeVisible;
            }
        }
    }
    
    System.Collections.IEnumerator ApplyVisibilityChangesAsync(HashSet<GameObject> visibleObjects)
    {
        int processed = 0;
        
        foreach (var obj in objectsToManage)
        {
            if (obj == null) continue;
            
            bool shouldBeVisible = visibleObjects.Contains(obj);
            
            if (currentVisibility[obj] != shouldBeVisible)
            {
                obj.SetActive(shouldBeVisible);
                currentVisibility[obj] = shouldBeVisible;
            }
            
            processed++;
            
            // Каждые N объектов даём время другим процессам
            if (processed % objectsPerFrame == 0)
                yield return null;
        }
    }
    
    // Публичные методы
    
    [ContextMenu("Перестроить сетку")]
    public void RebuildGrid()
    {
        BuildSpatialGrid();
        needsUpdate = true;
        if (showDebugLogs)
            Debug.Log("Сетка перестроена");
    }
    
    public void SetVisibilityDistance(float newDistance)
    {
        visibilityDistance = Mathf.Max(1f, newDistance);
        needsUpdate = true;
        if (showDebugLogs)
            Debug.Log($"Дистанция видимости изменена на {visibilityDistance}");
    }
    
    public void AddObject(GameObject obj)
    {
        if (obj == null) return;
        
        // Добавляем в массив
        List<GameObject> newList = new List<GameObject>(objectsToManage);
        newList.Add(obj);
        objectsToManage = newList.ToArray();
        allObjectsList.Add(obj);
        
        // Добавляем в сетку
        Vector2Int cell = GetCellIndex(obj.transform.position);
        if (!spatialGrid.ContainsKey(cell))
            spatialGrid[cell] = new List<GameObject>();
        spatialGrid[cell].Add(obj);
        
        // Добавляем в словарь видимости
        currentVisibility[obj] = true;
        
        needsUpdate = true;
        
        if (showDebugLogs)
            Debug.Log($"Объект {obj.name} добавлен");
    }
    
    public void RemoveObject(GameObject obj)
    {
        if (obj == null) return;
        
        // Удаляем из массива
        List<GameObject> newList = new List<GameObject>();
        foreach (var item in objectsToManage)
        {
            if (item != obj)
                newList.Add(item);
        }
        objectsToManage = newList.ToArray();
        allObjectsList.Remove(obj);
        
        // Удаляем из сетки
        Vector2Int cell = GetCellIndex(obj.transform.position);
        if (spatialGrid.ContainsKey(cell))
            spatialGrid[cell].Remove(obj);
        
        // Удаляем из словаря видимости
        currentVisibility.Remove(obj);
        
        if (showDebugLogs)
            Debug.Log($"Объект {obj.name} удалён");
    }
    
    public void ForceUpdate()
    {
        lastPlayerCell = GetCellIndex(player.position);
        needsUpdate = true;
    }
    
    // Визуализация для отладки
    void OnDrawGizmos()
    {
        if (!drawDebugGrid || !Application.isPlaying)
            return;
        
        if (player != null)
        {
            // Рисуем радиус видимости
            Gizmos.color = new Color(0, 1, 0, 0.2f);
            Gizmos.DrawWireSphere(player.position, visibilityDistance);
            
            // Рисуем сетку
            Gizmos.color = new Color(1, 1, 0, 0.3f);
            Vector2Int centerCell = GetCellIndex(player.position);
            int radius = Mathf.CeilToInt(visibilityDistance / cellSize) + 1;
            
            for (int x = -radius; x <= radius; x++)
            {
                for (int z = -radius; z <= radius; z++)
                {
                    Vector3 cellCenter = new Vector3(
                        (centerCell.x + x) * cellSize + cellSize / 2,
                        0,
                        (centerCell.y + z) * cellSize + cellSize / 2
                    );
                    
                    Gizmos.DrawWireCube(cellCenter, new Vector3(cellSize, 0.1f, cellSize));
                }
            }
        }
    }
}