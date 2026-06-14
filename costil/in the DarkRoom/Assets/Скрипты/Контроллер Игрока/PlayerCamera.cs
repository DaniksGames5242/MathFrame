using UnityEngine;

public class PlayerCamera : MonoBehaviour
{
    [Header("Mouse Settings")]
    [SerializeField] private float mouseSensitivity = 2f;
    [SerializeField] private float maxLookAngle = 80f;
    [SerializeField] private float smoothing = 10f;

    [Header("Position Headbob (Смещение)")]
    [SerializeField] public bool enableHeadBob = true;
    [SerializeField] private float walkBobSpeed = 10f;
    [SerializeField] private float walkBobAmount = 0.05f;
    [SerializeField] private float sprintBobSpeed = 14f;
    [SerializeField] private float sprintBobAmount = 0.08f;
    [SerializeField] private float crouchBobSpeed = 6f;
    [SerializeField] private float crouchBobAmount = 0.03f;

    [Header("Rotation Headbob (Повороты при ходьбе)")]
    [SerializeField] private float walkRotateSpeed = 10f;
    [SerializeField] private float walkRotateAmount = 2.5f;
    [SerializeField] private float sprintRotateAmount = 4f;
    [SerializeField] private float crouchRotateAmount = 1.5f;

    [Header("Direction Reactions")]
    [SerializeField] private float forwardTilt = -1f;
    [SerializeField] private float backwardTilt = 1f;
    [SerializeField] private float strafeRoll = 2.5f;
    [SerializeField] private float directionSmoothing = 6f;

    [Header("Mouse Effects")]
    [SerializeField] private float mouseTiltAmount = 3f;
    [SerializeField] private float mouseSwayAmount = 0.015f;

    [Header("Jump & Land")]
    [SerializeField] private float jumpPitch = 2f;
    [SerializeField] private float jumpRoll = 1.5f;
    [SerializeField] private float landShake = 0.05f;

    [Header("Crouch Settings")]
    [SerializeField] private float crouchTransitionSpeed = 10f;
    [SerializeField] private float standingCameraHeight = 0.9f;
    [SerializeField] private float crouchCameraHeight = 0.6f;

    [Header("FOV Settings")]
    [SerializeField] private bool enableFOVChange = true;
    [SerializeField] private float normalFOV = 75f;
    [SerializeField] private float runFOV = 78f;
    [SerializeField] private float crouchFOV = 70f;
    [SerializeField] private float slideFOV = 82f;
    [SerializeField] private float fovChangeSpeed = 6f;

    [Header("Slide Settings")]
    [SerializeField] private float slideTiltAmount = 3f;
    [SerializeField] private float slideTiltSmooth = 10f;

    [Header("References")]
    [SerializeField] private Transform playerBody;
    [SerializeField] private PlayerMovement playerMovement;
    [SerializeField] private Camera playerCameraComponent;

    // Mouse look
    private float yaw = 0f;
    private float pitch = 0f;
    private float currentTilt = 0f;
    private float targetTilt = 0f;
    private float currentSwayX = 0f;

    // Headbob
    private float bobTimer = 0f;
    private Vector3 currentBobOffset;
    private float bobRotTimer = 0f;
    private Vector3 currentRotOffset;
    private Vector3 directionRotOffset;
    private Vector3 targetDirectionRot;

    // Jump/Land
    private float jumpTimer = 0f;
    private Vector3 jumpRotOffset;
    private float landTimer = 0f;
    private Vector3 landRotOffset;
    private float lastVerticalSpeed = 0f;
    private bool wasGrounded = true;

    // Idle breath
    private float idleBreathTimer = 0f;

    // Crouch
    private Vector3 originalCameraLocalPosition;
    private float currentCrouchOffset = 0f;
    private float targetCrouchOffset = 0f;
    private bool isCrouching = false;

    // Slide
    private bool isSliding = false;
    private float slideTilt = 0f;
    private float currentSlideTilt = 0f;

    // FOV
    private float targetFOV;
    private float currentFOV;

    // State
    private bool controlsEnabled = true;
    private Transform cameraTransform;
    private float actualMoveSpeed;

    public bool IsHeadBobEnabled => enableHeadBob;

    private void Start()
    {
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;

        if (playerBody == null)
        {
            playerBody = transform.parent;
            if (playerBody == null)
            {
                enabled = false;
                return;
            }
        }

        if (playerMovement == null)
            playerMovement = playerBody.GetComponent<PlayerMovement>();

        if (playerMovement == null)
            playerMovement = GetComponentInParent<PlayerMovement>();

        if (playerCameraComponent == null)
            playerCameraComponent = GetComponentInChildren<Camera>();

        if (playerCameraComponent == null)
            playerCameraComponent = GetComponent<Camera>();

        if (playerCameraComponent == null)
        {
            enabled = false;
            return;
        }

        cameraTransform = playerCameraComponent.transform;
        
        // Сохраняем текущую позицию (возможно, неправильную)
        originalCameraLocalPosition = cameraTransform.localPosition;
        
        // Принудительно устанавливаем правильную высоту стояния
        Vector3 correctedPos = new Vector3(originalCameraLocalPosition.x, standingCameraHeight, originalCameraLocalPosition.z);
        cameraTransform.localPosition = correctedPos;
        originalCameraLocalPosition = correctedPos; // пересохраняем эталон

        targetFOV = normalFOV;
        currentFOV = normalFOV;
        playerCameraComponent.fieldOfView = currentFOV;

        if (playerBody != null)
            yaw = playerBody.eulerAngles.y;

        pitch = cameraTransform.localEulerAngles.x;
        if (pitch > 180f) pitch -= 360f;
        pitch = Mathf.Clamp(pitch, -maxLookAngle, maxLookAngle);
    }

    private void Update()
    {
        if (!controlsEnabled)
            return;

        if (Cursor.lockState != CursorLockMode.Locked)
            return;

        HandleMouseLook();
    }

    private void LateUpdate()
    {
        if (!controlsEnabled)
            return;

        if (playerMovement != null)
            playerMovement.SetCurrentRotation(Quaternion.Euler(0f, yaw, 0f));

        UpdateMovementSpeed();
        HandleProceduralEffects();
        UpdateFOV();
        ApplyCameraTransform();
    }

    private void HandleMouseLook()
    {
        float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity;
        float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity;

        yaw += mouseX;
        pitch -= mouseY;
        pitch = Mathf.Clamp(pitch, -maxLookAngle, maxLookAngle);

        float smoothFactor = Mathf.Clamp01(smoothing * Time.deltaTime);

        if (playerBody != null)
            playerBody.rotation = Quaternion.Slerp(playerBody.rotation, Quaternion.Euler(0, yaw, 0), smoothFactor);

        // Mouse tilt effect
        targetTilt = -mouseX * mouseSensitivity * mouseTiltAmount;
        targetTilt = Mathf.Clamp(targetTilt, -12f, 12f);
        currentTilt = Mathf.Lerp(currentTilt, targetTilt, Time.deltaTime * 12f);

        // Mouse sway for camera position
        currentSwayX = Mathf.Lerp(currentSwayX, -mouseX * mouseSensitivity * mouseSwayAmount, Time.deltaTime * 8f);
    }

    private void UpdateMovementSpeed()
    {
        if (playerMovement != null)
            actualMoveSpeed = playerMovement.GetCurrentSpeed();
        else
            actualMoveSpeed = 0f;
    }

    private void HandleProceduralEffects()
    {
        float inputMagnitude = new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical")).magnitude;
        bool isGrounded = playerMovement != null && playerMovement.IsGrounded();
        bool isSprinting = playerMovement != null && playerMovement.IsRunning();
        bool isCrouchingState = playerMovement != null && playerMovement.IsCrouching();
        
        bool isMoving = inputMagnitude > 0.1f && isGrounded && actualMoveSpeed > 0.3f && !isSliding;

        // Position Headbob
        Vector3 targetBob = Vector3.zero;

        if (isMoving)
        {
            float currentBobSpeed = walkBobSpeed;
            float currentBobAmount = walkBobAmount;

            if (isSprinting)
            {
                currentBobSpeed = sprintBobSpeed;
                currentBobAmount = sprintBobAmount;
            }
            else if (isCrouchingState)
            {
                currentBobSpeed = crouchBobSpeed;
                currentBobAmount = crouchBobAmount;
            }

            bobTimer += Time.deltaTime * currentBobSpeed;
            if (bobTimer > Mathf.PI * 2) bobTimer -= Mathf.PI * 2;

            targetBob = new Vector3(
                Mathf.Sin(bobTimer) * currentBobAmount,
                Mathf.Sin(bobTimer * 2f) * currentBobAmount,
                0
            );
        }
        else
        {
            bobTimer = Mathf.Lerp(bobTimer, 0f, Time.deltaTime * 8f);
            targetBob = Vector3.zero;
        }

        // Idle breath
        if (!isMoving && isGrounded && jumpTimer <= 0 && landTimer <= 0 && actualMoveSpeed < 0.1f)
        {
            idleBreathTimer += Time.deltaTime * 1.2f;
            targetBob.y = Mathf.Sin(idleBreathTimer) * 0.002f;
            targetBob.x = Mathf.Sin(idleBreathTimer * 0.7f) * 0.001f;
        }

        // Rotation Headbob
        Vector3 targetRotBob = Vector3.zero;

        if (isMoving)
        {
            float currentRotAmount = walkRotateAmount;
            if (isSprinting) currentRotAmount = sprintRotateAmount;
            else if (isCrouchingState) currentRotAmount = crouchRotateAmount;

            bobRotTimer += Time.deltaTime * walkRotateSpeed;
            if (bobRotTimer > Mathf.PI * 2) bobRotTimer -= Mathf.PI * 2;

            targetRotBob = new Vector3(
                Mathf.Sin(bobRotTimer * 2f) * currentRotAmount * 0.8f,
                Mathf.Sin(bobRotTimer * 1.5f) * currentRotAmount * 0.4f,
                Mathf.Sin(bobRotTimer) * currentRotAmount * 0.6f
            );
        }
        else
        {
            bobRotTimer = Mathf.Lerp(bobRotTimer, 0f, Time.deltaTime * 8f);
            targetRotBob = Vector3.zero;
        }

        // Direction reactions
        float moveX = Input.GetAxisRaw("Horizontal");
        float moveZ = Input.GetAxisRaw("Vertical");
        
        Vector3 targetDirectionRot = Vector3.zero;

        if (isMoving)
        {
            if (moveZ > 0.1f) targetDirectionRot.x = forwardTilt * moveZ;
            else if (moveZ < -0.1f) targetDirectionRot.x = backwardTilt * -moveZ;

            targetDirectionRot.z = -moveX * strafeRoll;
            targetDirectionRot.y = -moveX * strafeRoll * 0.4f;
        }

        directionRotOffset = Vector3.Lerp(directionRotOffset, targetDirectionRot, Time.deltaTime * directionSmoothing);

        // Handle landing effect
        HandleLandingEffect();

        // Combine all rotations
        Vector3 totalRot = targetRotBob + directionRotOffset;

        if (jumpTimer > 0.01f)
            totalRot += jumpRotOffset;

        if (landTimer > 0.01f)
            totalRot += landRotOffset;

        totalRot.x = Mathf.Clamp(totalRot.x, -8f, 8f);
        totalRot.y = Mathf.Clamp(totalRot.y, -5f, 5f);
        totalRot.z = Mathf.Clamp(totalRot.z, -10f, 10f);

        // Zero out micro-values
        if (Mathf.Abs(totalRot.x) < 0.001f) totalRot.x = 0f;
        if (Mathf.Abs(totalRot.y) < 0.001f) totalRot.y = 0f;
        if (Mathf.Abs(totalRot.z) < 0.001f) totalRot.z = 0f;

        currentRotOffset = Vector3.Lerp(currentRotOffset, totalRot, Time.deltaTime * 12f);

        // Position offset (combine bob, mouse sway, and clamp)
        Vector3 finalPosOffset = targetBob + new Vector3(currentSwayX, 0, 0);
        finalPosOffset.x = Mathf.Clamp(finalPosOffset.x, -0.15f, 0.15f);
        finalPosOffset.y = Mathf.Clamp(finalPosOffset.y, -0.12f, 0.12f);

        currentBobOffset = Vector3.Lerp(currentBobOffset, finalPosOffset, Time.deltaTime * 15f);
        
        // Плавное изменение crouch offset
        currentCrouchOffset = Mathf.Lerp(currentCrouchOffset, targetCrouchOffset, Time.deltaTime * crouchTransitionSpeed);
    }

    private void HandleLandingEffect()
    {
        if (playerMovement == null) return;

        bool isGrounded = playerMovement.IsGrounded();
        float verticalVelocity = playerMovement.GetVerticalVelocity();

        if (isGrounded && !wasGrounded && lastVerticalSpeed < -5f)
        {
            float intensity = Mathf.Clamp01(Mathf.Abs(lastVerticalSpeed) / 15f);
            landTimer = 0.2f;
            landRotOffset = new Vector3(
                Random.Range(-landShake, landShake) * intensity,
                0,
                Random.Range(-landShake * 0.5f, landShake * 0.5f) * intensity
            );
        }

        // Fade out landing
        if (landTimer > 0)
        {
            landTimer -= Time.deltaTime;
            landRotOffset = Vector3.Lerp(landRotOffset, Vector3.zero, Time.deltaTime * 15f);

            if (landTimer <= 0.01f)
            {
                landTimer = 0f;
                landRotOffset = Vector3.zero;
            }
        }

        // Handle jump
        wasGrounded = isGrounded;
        lastVerticalSpeed = verticalVelocity;
    }

    public void TriggerJump()
    {
        jumpTimer = 0.2f;
        jumpRotOffset = new Vector3(-jumpPitch, 0, Random.Range(-jumpRoll, jumpRoll));
    }

    private void UpdateFOV()
    {
        if (!enableFOVChange || playerCameraComponent == null || playerMovement == null)
            return;

        bool isActuallyMoving = playerMovement.IsActuallyMoving();
        bool isCrouchingState = playerMovement.IsCrouching();
        bool isRunning = playerMovement.IsRunning();

        if (isSliding && isActuallyMoving)
            targetFOV = slideFOV;
        else if (isCrouchingState)
            targetFOV = crouchFOV;
        else if (isRunning && isActuallyMoving)
            targetFOV = runFOV;
        else
            targetFOV = normalFOV;

        currentFOV = Mathf.Lerp(currentFOV, targetFOV, fovChangeSpeed * Time.deltaTime);
        playerCameraComponent.fieldOfView = currentFOV;
    }

    private void ApplyCameraTransform()
    {
        if (cameraTransform == null)
            return;

        // Позиция: изначальная позиция + смещение приседания + процедурные эффекты
        Vector3 finalPos = originalCameraLocalPosition;
        finalPos.y += currentCrouchOffset;
        finalPos += currentBobOffset;
        
        cameraTransform.localPosition = Vector3.Lerp(cameraTransform.localPosition, finalPos, Time.deltaTime * crouchTransitionSpeed);

        // Rotation: pitch + mouse tilt + all procedural rotations + slide tilt
        Quaternion targetRot = Quaternion.Euler(pitch, 0, currentTilt);
        targetRot *= Quaternion.Euler(currentRotOffset);
        targetRot *= Quaternion.Euler(0, 0, currentSlideTilt);
        
        cameraTransform.localRotation = Quaternion.Slerp(cameraTransform.localRotation, targetRot, Time.deltaTime * smoothing);
    }

    // Публичные методы для вызова из PlayerMovement
    public void UpdateCrouch(bool crouching)
    {
        isCrouching = crouching;
        
        // Вычисляем смещение относительно ИЗНАЧАЛЬНОЙ позиции камеры
        if (crouching)
            targetCrouchOffset = crouchCameraHeight - originalCameraLocalPosition.y;
        else
            targetCrouchOffset = standingCameraHeight - originalCameraLocalPosition.y;
    }

    public void StartSlide(Vector3 direction)
    {
        isSliding = true;

        if (playerBody != null && direction != Vector3.zero)
        {
            float angle = Vector3.SignedAngle(playerBody.forward, direction.normalized, Vector3.up);
            slideTilt = Mathf.Clamp(angle * 0.1f, -slideTiltAmount, slideTiltAmount);
        }
        
        currentSlideTilt = 0f;
    }

    public void EndSlide()
    {
        isSliding = false;
        slideTilt = 0f;
    }

    public void SetControlsEnabled(bool enabled)
    {
        controlsEnabled = enabled;
    }

    public bool AreControlsEnabled()
    {
        return controlsEnabled;
    }

    public void SetRotation(float pitchAngle, float yawAngle)
    {
        pitch = Mathf.Clamp(pitchAngle, -maxLookAngle, maxLookAngle);
        yaw = yawAngle;

        if (playerBody != null)
            playerBody.rotation = Quaternion.Euler(0f, yaw, 0f);
    }

    public float GetYawRotation()
    {
        return yaw;
    }

    public float GetPitchRotation()
    {
        return pitch;
    }

    public void SetSensitivity(float sensitivity)
    {
        mouseSensitivity = Mathf.Max(0.1f, sensitivity);
    }

    public void ToggleCursorLock()
    {
        if (Cursor.lockState == CursorLockMode.Locked)
        {
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
        }
        else
        {
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }
    }

    public void SetHeadBobEnabled(bool value)
    {
        enableHeadBob = value;
    }

    public void SetFOVChangeEnabled(bool value)
    {
        enableFOVChange = value;
    }

    public Transform GetCameraTransform()
    {
        return cameraTransform;
    }

    public Camera GetCamera()
    {
        return playerCameraComponent;
    }
}