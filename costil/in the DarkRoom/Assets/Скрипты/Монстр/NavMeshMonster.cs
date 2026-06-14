using UnityEngine;
using UnityEngine.AI;
using UnityEngine.SceneManagement;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

[RequireComponent(typeof(NavMeshAgent))]
[RequireComponent(typeof(CapsuleCollider))]
[RequireComponent(typeof(Rigidbody))]
public class NavMeshMonster : MonoBehaviour
{
    [Header("Vision Settings")]
    public float viewDistance = 15f;
    public float viewAngle = 100f;
    public float eyeHeight = 1.5f;
    
    [Header("Hearing Settings")]
    public float hearingDistance = 20f;
    public float minHearingIntensity = 0.15f;
    
    [Header("Movement Settings")]
    public float chaseSpeed = 5.5f;
    public float patrolSpeed = 2.5f;
    public float investigateSpeed = 3.5f;
    
    [Header("Animation Settings")]
    public Animator monsterAnimator;
    [Range(0f, 1f)] public float idleAnimationSpeed = 0f;
    [Range(0f, 2f)] public float walkAnimationSpeed = 0.5f;
    [Range(0f, 2f)] public float runAnimationSpeed = 1.2f;
    [Range(0f, 2f)] public float investigateAnimationSpeed = 0.7f;
    [Range(0f, 2f)] public float searchAnimationSpeed = 0.6f;
    
    [Header("Exploration Settings")]
    public float explorationRadius = 15f;
    public float patrolPointGenerationRadius = 20f;
    
    [Header("Anti-Stuck Settings")]
    [Tooltip("Радиус проверки на застревание")]
    public float stuckCheckRadius = 0.8f;
    [Tooltip("Время без движения до попытки освобождения")]
    public float stuckTimeThreshold = 1.5f;
    [Tooltip("Сила отталкивания от стен")]
    public float pushForce = 3f;
    [Tooltip("Слои препятствий")]
    public LayerMask obstacleLayers = -1;
    
    [Header("Search Settings")]
    public int searchPassesCount = 2;
    public float timeBetweenSearchPasses = 1.5f;
    public float searchRadius = 10f;
    
    [Header("Movement Smoothing")]
    [Range(1f, 20f)] public float rotationSmoothness = 12f;
    public float distanceToChangePoint = 1.5f;
    
    [Header("Audio")]
    public AudioClip detectSound;
    public AudioClip chaseLoopSound;
    public AudioClip lostSound;
    public AudioClip heardSound;
    [Range(0f, 1f)] public float soundVolume = 0.7f;
    public float chaseSoundFadeTime = 0.5f;
    
    [Header("Scare Settings")]
    public AudioClip scareSound;
    [Range(0f, 1f)] public float scareSoundVolume = 1f;
    public GameObject[] objectsToShow;
    public GameObject objectToHide;
    public float reloadDelay = 3f;
    public float showDelay = 0.2f;
    public bool showCursorBeforeReload = true;
    
    [Header("Debug")]
    public bool showDebugGizmos = true;
    
    private NavMeshAgent agent;
    private Rigidbody rb;
    private CapsuleCollider capsuleCollider;
    private Transform player;
    private string currentState = "Patrol";
    private Vector3 lastKnownPlayerPosition;
    
    // Исследование локации
    private List<Vector3> exploredPositions = new List<Vector3>();
    private List<Vector3> deadEnds = new List<Vector3>();
    private float stuckTimer = 0f;
    private Vector3 lastPosition;
    private Vector3 lastValidPosition;
    
    // Аудио
    private AudioSource audioSource;
    private AudioSource chaseLoopSource;
    private Coroutine fadeChaseSoundCoroutine;
    private float originalChaseVolume;
    private bool isChaseSoundPlaying = false;
    
    // Поиск
    private List<Vector3> currentSearchPoints = new List<Vector3>();
    private int currentSearchPass = 0;
    private bool isSearching = false;
    private Coroutine searchCoroutine;
    
    // Скример
    private bool isScareActive = false;
    private AudioSource scareAudioSource;
    private float originalTimeScale;
    
    // Анимация
    private float currentAnimSpeed = 0f;
    private float targetAnimSpeed = 0f;
    private float animSpeedChangeRate = 5f;
    
    // Таймеры
    private float lastSoundTime = 0f;
    private float lastSeenTime = 0f;
    private Vector3 lastEscapeDirection;

    private void Start()
    {
        InitializeComponents();
        FindPlayer();
        SetupAudio();
        SetupScareSystem();
        SetupAnimator();
        
        exploredPositions.Add(transform.position);
        lastValidPosition = transform.position;
        
        StartCoroutine(InitializePatrol());
        
        Debug.Log($"{name}: Старт! isOnNavMesh: {agent.isOnNavMesh}");
    }
    
    private void InitializeComponents()
    {
        agent = GetComponent<NavMeshAgent>();
        agent.autoBraking = false;
        agent.stoppingDistance = 0.3f;
        agent.speed = patrolSpeed;
        agent.updateRotation = false;
        agent.radius = 0.4f;
        agent.height = 1.6f;
        
        // Настройка Rigidbody для физики
        rb = GetComponent<Rigidbody>();
        if (rb == null) rb = gameObject.AddComponent<Rigidbody>();
        rb.isKinematic = true;
        rb.constraints = RigidbodyConstraints.FreezeRotation;
        
        // Настройка коллайдера
        capsuleCollider = GetComponent<CapsuleCollider>();
        if (capsuleCollider != null)
        {
            capsuleCollider.radius = 0.5f;
            capsuleCollider.height = 1.8f;
            capsuleCollider.center = Vector3.up * 0.9f;
            capsuleCollider.isTrigger = false;
        }
        
        lastPosition = transform.position;
    }
    
    private IEnumerator InitializePatrol()
    {
        yield return null;
        
        if (!agent.isOnNavMesh)
        {
            NavMeshHit hit;
            if (NavMesh.SamplePosition(transform.position, out hit, 10f, NavMesh.AllAreas))
            {
                agent.Warp(hit.position);
                Debug.Log($"{name}: Телепортирован на NavMesh в {hit.position}");
            }
            else
            {
                Debug.LogError($"{name}: Не удалось найти позицию на NavMesh!");
                yield break;
            }
        }
        
        StartExploration();
    }
    
    private void SetupAnimator()
    {
        if (monsterAnimator == null)
        {
            monsterAnimator = GetComponentInChildren<Animator>();
            if (monsterAnimator == null)
            {
                Debug.LogWarning($"{name}: Animator не найден!");
                return;
            }
        }
        monsterAnimator.enabled = true;
        monsterAnimator.speed = idleAnimationSpeed;
        currentAnimSpeed = idleAnimationSpeed;
        targetAnimSpeed = idleAnimationSpeed;
    }
    
    private void UpdateAnimationSpeed()
    {
        if (monsterAnimator == null) return;
        
        float newTargetSpeed = idleAnimationSpeed;
        
        switch (currentState)
        {
            case "Patrol":
                newTargetSpeed = agent.velocity.magnitude < 0.2f ? idleAnimationSpeed : walkAnimationSpeed;
                break;
            case "InvestigateSound":
            case "Search":
                newTargetSpeed = agent.velocity.magnitude < 0.2f ? idleAnimationSpeed : investigateAnimationSpeed;
                break;
            case "Chase":
                newTargetSpeed = runAnimationSpeed;
                break;
            default:
                newTargetSpeed = walkAnimationSpeed;
                break;
        }
        
        targetAnimSpeed = newTargetSpeed;
        currentAnimSpeed = Mathf.Lerp(currentAnimSpeed, targetAnimSpeed, Time.deltaTime * animSpeedChangeRate);
        monsterAnimator.speed = currentAnimSpeed;
    }
    
    private void SetupScareSystem()
    {
        scareAudioSource = gameObject.AddComponent<AudioSource>();
        scareAudioSource.playOnAwake = false;
        scareAudioSource.spatialBlend = 0f;
        scareAudioSource.volume = scareSoundVolume;
        
        if (objectsToShow != null)
        {
            foreach (GameObject obj in objectsToShow)
                if (obj != null) obj.SetActive(false);
        }
        if (objectToHide != null) objectToHide.SetActive(true);
    }
    
    private void SetupAudio()
    {
        audioSource = GetComponent<AudioSource>();
        if (audioSource == null) audioSource = gameObject.AddComponent<AudioSource>();
        audioSource.spatialBlend = 1f;
        audioSource.volume = soundVolume;
        
        chaseLoopSource = gameObject.AddComponent<AudioSource>();
        chaseLoopSource.loop = true;
        chaseLoopSource.playOnAwake = false;
        chaseLoopSource.spatialBlend = 1f;
        chaseLoopSource.volume = 0f;
        if (chaseLoopSound != null) chaseLoopSource.clip = chaseLoopSound;
        originalChaseVolume = soundVolume * 0.6f;
    }
    
    private void FindPlayer()
    {
        GameObject playerObj = GameObject.FindGameObjectWithTag("Player");
        if (playerObj != null) player = playerObj.transform;
    }
    
    private void Update()
    {
        if (isScareActive || player == null) return;
        
        UpdateAnimationSpeed();
        
        // Проверка на застревание
        CheckAndResolveStuck();
        
        bool canSee = CanSeePlayer();
        if (canSee) lastSeenTime = Time.time;
        
        switch (currentState)
        {
            case "Patrol":
                UpdatePatrol();
                if (canSee) StartChase(player.position);
                break;
                
            case "InvestigateSound":
                UpdateInvestigate();
                if (canSee) StartChase(player.position);
                break;
                
            case "Chase":
                UpdateChase();
                break;
                
            case "Search":
                UpdateSearch();
                if (canSee) StartChase(player.position);
                break;
        }
        
        UpdateRotation();
        
        // Сохраняем последнюю валидную позицию
        if (agent.isOnNavMesh && agent.velocity.magnitude > 0.1f)
        {
            lastValidPosition = transform.position;
        }
    }
    
    private void CheckAndResolveStuck()
    {
        if (currentState == "Chase") return;
        
        float movedDistance = Vector3.Distance(transform.position, lastPosition);
        
        if (movedDistance < 0.1f && agent.remainingDistance > 1f)
        {
            stuckTimer += Time.deltaTime;
            
            if (stuckTimer > stuckTimeThreshold)
            {
                Debug.Log($"{name}: Застрял! Пытаюсь освободиться...");
                ResolveStuck();
                stuckTimer = 0f;
            }
        }
        else
        {
            stuckTimer = 0f;
        }
        
        lastPosition = transform.position;
    }
    
    private void ResolveStuck()
    {
        // Способ 1: Небольшой толчок в случайном направлении
        Vector3 randomDir = Random.insideUnitSphere.normalized;
        randomDir.y = 0;
        Vector3 pushPoint = transform.position + randomDir * pushForce;
        
        NavMeshHit hit;
        if (NavMesh.SamplePosition(pushPoint, out hit, pushForce, NavMesh.AllAreas))
        {
            agent.Warp(hit.position);
            Debug.Log($"{name}: Освобождён через телепортацию в {hit.position}");
        }
        
        // Способ 2: Принудительная смена цели
        ForceNewDestination();
    }
    
    private void OnCollisionStay(Collision collision)
    {
        // Если застрял в стене - пытаемся оттолкнуться
        if (currentState != "Chase" && agent.velocity.magnitude < 0.2f)
        {
            if (collision.gameObject.CompareTag("Wall") || collision.gameObject.layer == LayerMask.NameToLayer("Wall"))
            {
                Vector3 awayFromWall = (transform.position - collision.contacts[0].point).normalized;
                awayFromWall.y = 0;
                
                Vector3 newPos = transform.position + awayFromWall * 0.5f;
                NavMeshHit hit;
                if (NavMesh.SamplePosition(newPos, out hit, 1f, NavMesh.AllAreas))
                {
                    agent.Warp(hit.position);
                    Debug.Log($"{name}: Оттолкнулся от стены");
                }
            }
        }
    }
    
    #region Patrol System
    
    private void StartExploration()
    {
        currentState = "Patrol";
        agent.speed = patrolSpeed;
        ForceNewDestination();
        Debug.Log($"{name}: Начинаю патрулирование");
    }
    
    private void UpdatePatrol()
    {
        if (!agent.hasPath || agent.remainingDistance < distanceToChangePoint)
        {
            ForceNewDestination();
        }
    }
    
    private void ForceNewDestination()
    {
        for (int attempt = 0; attempt < 25; attempt++)
        {
            Vector3 randomPoint = transform.position + Random.insideUnitSphere * patrolPointGenerationRadius;
            randomPoint.y = transform.position.y;
            
            NavMeshHit hit;
            if (NavMesh.SamplePosition(randomPoint, out hit, patrolPointGenerationRadius, NavMesh.AllAreas))
            {
                // Проверяем, что точка не в стене
                if (!IsPointInWall(hit.position))
                {
                    agent.SetDestination(hit.position);
                    Debug.Log($"{name}: Иду в точку {hit.position}");
                    return;
                }
            }
        }
        
        // Если не нашли точку - идём вперёд
        Vector3 forwardPoint = transform.position + transform.forward * 8f;
        NavMeshHit forwardHit;
        if (NavMesh.SamplePosition(forwardPoint, out forwardHit, 8f, NavMesh.AllAreas))
        {
            if (!IsPointInWall(forwardHit.position))
            {
                agent.SetDestination(forwardHit.position);
            }
        }
    }
    
    private bool IsPointInWall(Vector3 point)
    {
        Collider[] colliders = Physics.OverlapSphere(point + Vector3.up * 0.5f, 0.6f, obstacleLayers);
        foreach (var col in colliders)
        {
            if (col.isTrigger == false && col.gameObject != gameObject)
            {
                return true;
            }
        }
        return false;
    }
    
    #endregion
    
    #region Vision
    
    private bool CanSeePlayer()
    {
        if (player == null) return false;
        
        Vector3 eyePos = transform.position + Vector3.up * eyeHeight;
        Vector3 playerPos = player.position + Vector3.up * 0.5f;
        float distance = Vector3.Distance(eyePos, playerPos);
        
        if (distance > viewDistance) return false;
        
        float angle = Vector3.Angle(transform.forward, (playerPos - eyePos).normalized);
        if (angle > viewAngle / 2) return false;
        
        RaycastHit hit;
        if (Physics.Raycast(eyePos, (playerPos - eyePos).normalized, out hit, distance))
        {
            if (hit.transform == player || hit.transform.IsChildOf(player))
                return true;
        }
        return false;
    }
    
    #endregion
    
    #region Hearing
    
    public void HearSound(Vector3 soundPosition, float soundIntensity, bool isCrouching)
    {
        if (currentState == "Chase") return;
        if (isCrouching) return;
        
        float distance = Vector3.Distance(transform.position, soundPosition);
        if (distance > hearingDistance) return;
        
        float finalIntensity = soundIntensity * (1f - distance / hearingDistance);
        
        if (finalIntensity > minHearingIntensity)
        {
            lastSoundTime = Time.time;
            Debug.Log($"{name}: Услышал звук! Расстояние: {distance:F1}");
            PlayHeardSound();
            StartInvestigateSound(soundPosition);
        }
    }
    
    private void PlayHeardSound()
    {
        if (heardSound != null && audioSource != null)
            audioSource.PlayOneShot(heardSound, soundVolume);
    }
    
    private void StartInvestigateSound(Vector3 soundPosition)
    {
        if (currentState == "Chase") return;
        
        currentState = "InvestigateSound";
        agent.speed = investigateSpeed;
        agent.SetDestination(soundPosition);
        StartCoroutine(InvestigateTimeout());
        Debug.Log($"{name}: Иду на звук в {soundPosition}");
    }
    
    private IEnumerator InvestigateTimeout()
    {
        yield return new WaitForSeconds(3f);
        if (currentState == "InvestigateSound")
        {
            StartPredictiveSearch();
        }
    }
    
    private void UpdateInvestigate()
    {
        if (agent.remainingDistance < distanceToChangePoint)
        {
            StartPredictiveSearch();
        }
    }
    
    #endregion
    
    #region Chase
    
    private void StartChase(Vector3 position)
    {
        if (currentState == "Chase") return;
        
        if (searchCoroutine != null)
        {
            StopCoroutine(searchCoroutine);
            searchCoroutine = null;
        }
        isSearching = false;
        
        currentState = "Chase";
        agent.speed = chaseSpeed;
        agent.SetDestination(position);
        lastKnownPlayerPosition = position;
        
        if (detectSound != null)
            audioSource.PlayOneShot(detectSound, soundVolume);
        
        StartChaseSound();
        Debug.Log($"{name}: Начал погоню!");
    }
    
    private void UpdateChase()
    {
        if (CanSeePlayer())
        {
            lastKnownPlayerPosition = player.position;
            lastSeenTime = Time.time;
            lastEscapeDirection = (player.position - transform.position).normalized;
            agent.SetDestination(player.position);
        }
        else if (lastKnownPlayerPosition != Vector3.zero)
        {
            NavMeshPath path = new NavMeshPath();
            if (NavMesh.CalculatePath(transform.position, lastKnownPlayerPosition, NavMesh.AllAreas, path))
            {
                if (path.status == NavMeshPathStatus.PathComplete)
                {
                    agent.SetDestination(lastKnownPlayerPosition);
                }
                else
                {
                    StopChaseSound();
                    StartPredictiveSearch();
                }
            }
        }
        
        if (Time.time - lastSeenTime > 5f && Time.time - lastSoundTime > 3f)
        {
            StopChaseSound();
            StartPredictiveSearch();
        }
    }
    
    #endregion
    
    #region Predictive Search
    
    private void StartPredictiveSearch()
    {
        if (isSearching) return;
        
        currentState = "Search";
        agent.speed = investigateSpeed;
        currentSearchPass = 0;
        isSearching = true;
        
        GeneratePredictiveSearchPoints();
        searchCoroutine = StartCoroutine(SearchCoroutine());
        Debug.Log($"{name}: Начинаю поиск");
    }
    
    private void GeneratePredictiveSearchPoints()
    {
        currentSearchPoints.Clear();
        
        Vector3 searchCenter = lastKnownPlayerPosition != Vector3.zero ? lastKnownPlayerPosition : transform.position;
        
        if (lastEscapeDirection != Vector3.zero)
        {
            for (float dist = 5f; dist <= searchRadius; dist += 5f)
            {
                Vector3 point = searchCenter + lastEscapeDirection * dist;
                NavMeshHit hit;
                if (NavMesh.SamplePosition(point, out hit, 4f, NavMesh.AllAreas))
                    currentSearchPoints.Add(hit.position);
            }
        }
        
        for (int i = 0; i < 8; i++)
        {
            float angle = (360f / 8) * i;
            Vector3 dir = new Vector3(Mathf.Sin(angle * Mathf.Deg2Rad), 0, Mathf.Cos(angle * Mathf.Deg2Rad));
            Vector3 point = searchCenter + dir * 6f;
            
            NavMeshHit hit;
            if (NavMesh.SamplePosition(point, out hit, 5f, NavMesh.AllAreas))
                if (!currentSearchPoints.Contains(hit.position))
                    currentSearchPoints.Add(hit.position);
        }
        
        for (int i = 0; i < currentSearchPoints.Count; i++)
        {
            int rand = Random.Range(i, currentSearchPoints.Count);
            (currentSearchPoints[i], currentSearchPoints[rand]) = (currentSearchPoints[rand], currentSearchPoints[i]);
        }
    }
    
    private IEnumerator SearchCoroutine()
    {
        while (currentSearchPass < searchPassesCount)
        {
            foreach (Vector3 point in currentSearchPoints)
            {
                if (currentState != "Search") yield break;
                if (CanSeePlayer())
                {
                    StartChase(player.position);
                    yield break;
                }
                
                agent.SetDestination(point);
                
                float timeout = 4f;
                while (agent.remainingDistance > distanceToChangePoint && timeout > 0)
                {
                    if (CanSeePlayer())
                    {
                        StartChase(player.position);
                        yield break;
                    }
                    timeout -= Time.deltaTime;
                    yield return null;
                }
                yield return new WaitForSeconds(0.2f);
            }
            
            currentSearchPass++;
            if (currentSearchPass < searchPassesCount)
            {
                yield return new WaitForSeconds(timeBetweenSearchPasses);
                GeneratePredictiveSearchPoints();
            }
        }
        
        isSearching = false;
        searchCoroutine = null;
        StartExploration();
        Debug.Log($"{name}: Поиск завершён");
    }
    
    private void UpdateSearch()
    {
        if (Time.frameCount % 60 == 0 && currentSearchPoints.Count > 0)
        {
            GeneratePredictiveSearchPoints();
        }
    }
    
    #endregion
    
    #region Scare
    
    private void OnCollisionEnter(Collision collision)
    {
        if (isScareActive) return;
        if (collision.gameObject.CompareTag("Player")) TriggerScare();
    }
    
    private void OnTriggerEnter(Collider other)
    {
        if (isScareActive) return;
        if (other.CompareTag("Player")) TriggerScare();
    }
    
    private void TriggerScare()
    {
        if (isScareActive) return;
        isScareActive = true;
        StartCoroutine(ExecuteScareSequence());
    }
    
    private IEnumerator ExecuteScareSequence()
    {
        if (monsterAnimator != null) monsterAnimator.speed = 0f;
        StopAllGameAudio();
        
        originalTimeScale = Time.timeScale;
        Time.timeScale = 0.3f;
        
        yield return new WaitForSecondsRealtime(0.1f);
        
        if (scareSound != null && scareAudioSource != null)
            scareAudioSource.PlayOneShot(scareSound, scareSoundVolume);
        
        if (showDelay > 0) yield return new WaitForSecondsRealtime(showDelay);
        
        if (objectToHide != null) objectToHide.SetActive(false);
        
        if (objectsToShow != null)
        {
            foreach (GameObject obj in objectsToShow)
                if (obj != null) obj.SetActive(true);
        }
        
        if (showCursorBeforeReload)
        {
            Cursor.visible = true;
            Cursor.lockState = CursorLockMode.None;
        }
        
        yield return new WaitForSecondsRealtime(reloadDelay);
        
        Time.timeScale = 1f;
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
    }
    
    private void StopAllGameAudio()
    {
        AudioSource[] allSources = FindObjectsOfType<AudioSource>();
        foreach (AudioSource source in allSources)
            if (source != null && source.isPlaying) source.Stop();
        
        if (audioSource != null && audioSource.isPlaying) audioSource.Stop();
        if (chaseLoopSource != null && chaseLoopSource.isPlaying) chaseLoopSource.Stop();
        if (scareAudioSource != null && scareAudioSource.isPlaying) scareAudioSource.Stop();
    }
    
    #endregion
    
    #region Audio
    
    private void StartChaseSound()
    {
        if (fadeChaseSoundCoroutine != null) StopCoroutine(fadeChaseSoundCoroutine);
        
        if (chaseLoopSound != null && chaseLoopSource != null)
        {
            chaseLoopSource.volume = originalChaseVolume;
            chaseLoopSource.Play();
            isChaseSoundPlaying = true;
        }
    }
    
    private void StopChaseSound()
    {
        if (isChaseSoundPlaying && chaseLoopSource != null)
        {
            if (fadeChaseSoundCoroutine != null) StopCoroutine(fadeChaseSoundCoroutine);
            fadeChaseSoundCoroutine = StartCoroutine(FadeOutChaseSound());
        }
    }
    
    private IEnumerator FadeOutChaseSound()
    {
        if (chaseLoopSource == null) yield break;
        
        float startVolume = chaseLoopSource.volume;
        float elapsed = 0f;
        
        while (elapsed < chaseSoundFadeTime)
        {
            elapsed += Time.deltaTime;
            chaseLoopSource.volume = Mathf.Lerp(startVolume, 0f, elapsed / chaseSoundFadeTime);
            yield return null;
        }
        
        chaseLoopSource.volume = 0f;
        chaseLoopSource.Stop();
        isChaseSoundPlaying = false;
        fadeChaseSoundCoroutine = null;
    }
    
    public string GetState() => currentState;
    
    #endregion
    
    #region Helpers
    
    private void UpdateRotation()
    {
        if (agent.velocity.magnitude > 0.2f)
        {
            Quaternion target = Quaternion.LookRotation(agent.velocity.normalized);
            transform.rotation = Quaternion.Slerp(transform.rotation, target, rotationSmoothness * Time.deltaTime);
        }
    }
    
    private void OnDestroy()
    {
        if (searchCoroutine != null) StopCoroutine(searchCoroutine);
        Time.timeScale = 1f;
    }
    
    #endregion
    
    #region Debug
    
    private void OnDrawGizmosSelected()
    {
        if (!showDebugGizmos) return;
        
        Gizmos.color = Color.yellow;
        Vector3 eye = transform.position + Vector3.up * eyeHeight;
        Vector3 fwd = transform.forward;
        Gizmos.DrawRay(eye, Quaternion.Euler(0, -viewAngle/2, 0) * fwd * viewDistance);
        Gizmos.DrawRay(eye, Quaternion.Euler(0, viewAngle/2, 0) * fwd * viewDistance);
        Gizmos.DrawRay(eye, fwd * viewDistance);
        
        Gizmos.color = Color.cyan;
        Gizmos.DrawWireSphere(transform.position, hearingDistance);
        
        Gizmos.color = new Color(0, 1, 0, 0.3f);
        foreach (var pos in exploredPositions)
            Gizmos.DrawWireCube(pos, Vector3.one * 5f);
        
        if (agent != null && agent.hasPath && agent.destination != Vector3.zero)
        {
            Gizmos.color = currentState == "Chase" ? Color.red : Color.green;
            Gizmos.DrawSphere(agent.destination, 0.6f);
            Gizmos.DrawLine(transform.position, agent.destination);
        }
        
        // Визуализация проверки на застревание
        Gizmos.color = Color.red;
        Gizmos.DrawWireSphere(transform.position, stuckCheckRadius);
    }
    
    #endregion
}