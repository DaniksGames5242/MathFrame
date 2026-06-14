using UnityEngine;
using System.Collections.Generic;

[RequireComponent(typeof(Rigidbody), typeof(CapsuleCollider))]
public class PlayerMovement : MonoBehaviour
{
    [Header("Movement Settings")]
    [SerializeField] private float walkSpeed = 5f;
    [SerializeField] private float runSpeed = 8f;
    [SerializeField] private float crouchSpeed = 3f;
    [SerializeField] private float acceleration = 12f;
    [SerializeField] private float airControlFactor = 0.2f;

    [Header("Jump Settings")]
    [SerializeField] private float jumpForce = 5f;
    [SerializeField] private float groundCheckDistance = 0.1f;
    [SerializeField] private LayerMask groundMask = -1;

    [Header("Slope Settings")]
    [SerializeField] private float maxSlopeAngle = 45f;
    [SerializeField] private float slopeSlideForce = 8f;
    [SerializeField] private float maxSlideSlopeAngle = 60f;
    [SerializeField] private float slopeAcceleration = 15f;
    [SerializeField] private float maxSlopeSpeed = 15f;

    [Header("Slide Settings")]
    [SerializeField] private float slideSpeedMultiplier = 1.5f;
    [SerializeField] private float slideControl = 0.5f;
    [SerializeField] private float slideDeceleration = 2f;
    [SerializeField] private float slideMinSpeed = 3f;
    [SerializeField] private float minSlideStartSpeed = 4f;

    [Header("Step Climb Settings")]
    [SerializeField] private bool enableStepClimb = true;
    [SerializeField] private float maxStepHeight = 0.35f;
    [SerializeField] private float minStepHeight = 0.05f;
    [SerializeField] private float stepForwardDistance = 0.3f;
    [SerializeField] private float stepClimbDuration = 0.12f;

    [Header("Crouch Settings")]
    [SerializeField] private float crouchSmoothSpeed = 10f;
    [SerializeField] private float standCheckHeight = 0.1f;
    [SerializeField] private float crouchHeight = 1f;

    [Header("Wall Detection Settings")]
    [SerializeField] private float wallCheckRadius = 0.15f;
    [SerializeField] private float wallCheckDistance = 0.05f;

    [Header("Physics Interaction")]
    [SerializeField] private bool canPushObjects = true;
    [SerializeField] private float pushForce = 5f;
    [SerializeField] private float maxPushMass = 100f;
    [SerializeField] private LayerMask pushableLayerMask = -1;

    [Header("Ladder Settings")]
    [SerializeField] private LayerMask ladderMask = 0;
    [SerializeField] private float ladderClimbSpeed = 3f;
    [SerializeField] private float ladderExitOffset = 0.5f;
    [SerializeField] private float ladderDetectionRadius = 0.8f;

    [Header("References")]
    [SerializeField] private PlayerCamera playerCamera;

    private Rigidbody rb;
    private CapsuleCollider capsuleCollider;
    private PlayerCamera cachedPlayerCamera;

    private Vector2 inputDirection;
    private Vector2 rawInputDirection;
    private bool isRunningInput;
    private bool jumpRequested;

    private bool isGrounded;
    private RaycastHit groundHit;
    private bool isCrouching;
    private bool isSliding;

    private Vector3 currentVelocity;
    private float targetSpeed;

    private Quaternion currentRotation;
    private Quaternion fixedRotation;

    private Vector3 slideDirection;
    private float slideSpeed;
    private Vector3 slideControlDirection;

    private float targetCapsuleHeight;
    private float currentCapsuleHeight;
    private float standingHeight;
    private Vector3 standingCenter;
    private float standingBottomOffset;

    private bool isOnSteepSlope;
    private Vector3 slopeSlideDirection;

    private float lastHorizontalSpeed;

    private bool isClimbingStep;
    private Vector3 stepClimbStartPosition;
    private Vector3 stepClimbTargetPosition;
    private float stepClimbTimer;
    private Vector3 stepClimbVelocityCache;

    private bool isTouchingWall;
    private Vector3 lastWallNormal;
    private bool wallDetectedThisFrame;

    private bool controlsEnabled = true;

    // Ladder variables
    private bool isOnLadder;
    private Collider currentLadderCollider;
    private Vector3 ladderTopPoint;
    private Vector3 ladderBottomPoint;
    private float ladderVerticalInput;
    private Vector3 ladderForwardDirection;
    private GameObject ladderDetector;

    // Push cooldown tracking
    private Dictionary<Rigidbody, float> pushedObjectsCooldown = new Dictionary<Rigidbody, float>();
    private const float PUSH_COOLDOWN = 0.2f;

    private void Awake()
    {
        rb = GetComponent<Rigidbody>();
        capsuleCollider = GetComponent<CapsuleCollider>();
        
        if (playerCamera == null)
            playerCamera = GetComponentInChildren<PlayerCamera>();
        cachedPlayerCamera = playerCamera;

        if (rb == null || capsuleCollider == null)
        {
            enabled = false;
            return;
        }

        rb.interpolation = RigidbodyInterpolation.Interpolate;
        rb.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic;
        rb.freezeRotation = true;

        standingHeight = capsuleCollider.height;
        standingCenter = capsuleCollider.center;
        standingBottomOffset = standingCenter.y - standingHeight * 0.5f;

        currentCapsuleHeight = standingHeight;
        targetCapsuleHeight = standingHeight;

        currentRotation = transform.rotation;
        fixedRotation = currentRotation;
        targetSpeed = walkSpeed;

        CreateLadderDetector();
    }

    private void CreateLadderDetector()
    {
        ladderDetector = new GameObject("LadderDetector");
        ladderDetector.transform.SetParent(transform);
        ladderDetector.transform.localPosition = Vector3.zero;

        SphereCollider detectorCollider = ladderDetector.AddComponent<SphereCollider>();
        detectorCollider.isTrigger = true;
        detectorCollider.radius = ladderDetectionRadius;
        detectorCollider.center = new Vector3(0, 0.5f, 0);

        var triggerHandler = ladderDetector.AddComponent<LadderTriggerHandlerMovement>();
        triggerHandler.Initialize(this, ladderMask);
    }

    private void OnCollisionStay(Collision collision)
    {
        if (isOnLadder) return;

        foreach (ContactPoint contact in collision.contacts)
        {
            float angle = Vector3.Angle(Vector3.up, contact.normal);

            if (angle > maxSlopeAngle && angle < 135f)
            {
                wallDetectedThisFrame = true;
                lastWallNormal = contact.normal;
                break;
            }
        }

        if (canPushObjects && controlsEnabled)
        {
            PushRigidbody(collision);
        }
    }

    private void PushRigidbody(Collision collision)
    {
        Rigidbody hitRb = collision.rigidbody;

        if (hitRb == null || hitRb.isKinematic)
            return;

        if (hitRb.mass > maxPushMass)
            return;

        if (pushableLayerMask != -1 && ((1 << collision.gameObject.layer) & pushableLayerMask) == 0)
            return;

        // Check cooldown to prevent excessive force application
        if (pushedObjectsCooldown.ContainsKey(hitRb) && Time.time < pushedObjectsCooldown[hitRb])
            return;

        // Check if player is standing on top of the object
        bool isStandingOnTop = false;
        foreach (ContactPoint contact in collision.contacts)
        {
            if (contact.normal.y > 0.7f) // Player is standing on object
            {
                isStandingOnTop = true;
                break;
            }
        }
        
        if (isStandingOnTop)
            return;

        // Determine push direction from player's movement
        Vector3 moveDirection = GetWorldMoveDirection();
        if (moveDirection.sqrMagnitude < 0.1f)
        {
            // If not moving, use the direction away from the object's center
            Vector3 dirFromObject = transform.position - hitRb.worldCenterOfMass;
            dirFromObject.y = 0;
            if (dirFromObject.sqrMagnitude > 0.001f)
                moveDirection = dirFromObject.normalized;
            else
                return;
        }

        // Calculate push strength based on mass and speed
        float massRatio = Mathf.Clamp01(1f - (hitRb.mass / maxPushMass));
        float speedRatio = Mathf.Clamp01(lastHorizontalSpeed / runSpeed);
        float finalPushForce = pushForce * massRatio * Mathf.Max(0.3f, speedRatio);
        
        // Apply continuous force instead of impulse
        hitRb.AddForce(moveDirection * finalPushForce, ForceMode.Force);
        
        // Add to cooldown
        pushedObjectsCooldown[hitRb] = Time.time + PUSH_COOLDOWN;
    }

    private void Update()
    {
        if (!controlsEnabled)
            return;

        GetInput();
        
        if (!isOnLadder)
        {
            UpdateCrouchState();

            if (Input.GetKeyDown(KeyCode.Space) && isGrounded && !isSliding && !isOnSteepSlope)
                jumpRequested = true;
        }

        // Clean up push cooldown dictionary
        CleanupPushCooldown();
    }

    private void CleanupPushCooldown()
    {
        List<Rigidbody> toRemove = new List<Rigidbody>();
        foreach (var kvp in pushedObjectsCooldown)
        {
            if (Time.time >= kvp.Value)
                toRemove.Add(kvp.Key);
        }
        foreach (var rb in toRemove)
        {
            pushedObjectsCooldown.Remove(rb);
        }
    }

    private void FixedUpdate()
    {
        if (!controlsEnabled)
        {
            UpdateCapsuleCollider();
            return;
        }

        fixedRotation = currentRotation;
        transform.rotation = fixedRotation;

        if (!isOnLadder)
        {
            isTouchingWall = wallDetectedThisFrame;
            wallDetectedThisFrame = false;

            CheckGround();
            HandleSlopeSliding();
            CheckWallWithMultiRaycast();

            if (enableStepClimb && !isClimbingStep && isGrounded && !isSliding && !isCrouching)
                TryStepClimb();
        }
        else
        {
            // On ladder - reset ground states
            isGrounded = false;
            isOnSteepSlope = false;
            isTouchingWall = false;
        }

        if (isClimbingStep)
            ProcessStepClimb();
        else
            UpdateMovement();

        if (jumpRequested)
        {
            Jump();
            jumpRequested = false;
        }

        UpdateCapsuleCollider();
        lastHorizontalSpeed = new Vector3(rb.linearVelocity.x, 0f, rb.linearVelocity.z).magnitude;
    }

    private void GetInput()
    {
        rawInputDirection = new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical"));
        inputDirection = Vector2.ClampMagnitude(rawInputDirection, 1f);
        isRunningInput = Input.GetKey(KeyCode.LeftShift);
        ladderVerticalInput = Input.GetAxisRaw("Vertical");
    }

    private Vector3 GetWorldMoveDirection()
    {
        Vector3 forward = fixedRotation * Vector3.forward;
        Vector3 right = fixedRotation * Vector3.right;

        forward.y = 0f;
        right.y = 0f;

        if (forward.sqrMagnitude > 0.001f) forward.Normalize();
        if (right.sqrMagnitude > 0.001f) right.Normalize();

        Vector3 dir = forward * inputDirection.y + right * inputDirection.x;
        return dir.sqrMagnitude > 0.001f ? dir.normalized : Vector3.zero;
    }

    private void CheckWallWithMultiRaycast()
    {
        if (inputDirection.magnitude < 0.1f && !isTouchingWall)
            return;

        float radius = capsuleCollider.radius;
        float checkDist = radius + wallCheckDistance;

        float[] heights = new float[]
        {
            currentCapsuleHeight * 0.2f,
            currentCapsuleHeight * 0.5f,
            currentCapsuleHeight * 0.8f
        };

        Vector3 moveDir = GetWorldMoveDirection();
        Vector3 velDir = new Vector3(rb.linearVelocity.x, 0, rb.linearVelocity.z);
        if (velDir.sqrMagnitude > 0.01f) velDir.Normalize();

        Vector3[] checkDirections;

        if (moveDir.sqrMagnitude > 0.01f)
        {
            checkDirections = new Vector3[]
            {
                moveDir,
                velDir.sqrMagnitude > 0.01f ? velDir : moveDir,
                (moveDir + velDir).normalized
            };
        }
        else if (velDir.sqrMagnitude > 0.01f)
        {
            checkDirections = new Vector3[] { velDir };
        }
        else
        {
            return;
        }

        foreach (float h in heights)
        {
            Vector3 origin = transform.position + Vector3.up * (standingBottomOffset + h);

            foreach (Vector3 dir in checkDirections)
            {
                if (dir.sqrMagnitude < 0.001f) continue;

                if (Physics.Raycast(origin, dir, out RaycastHit hit, checkDist, groundMask, QueryTriggerInteraction.Ignore))
                {
                    float angle = Vector3.Angle(Vector3.up, hit.normal);

                    if (angle > maxSlopeAngle && angle < 135f)
                    {
                        isTouchingWall = true;
                        lastWallNormal = hit.normal;
                        return;
                    }
                }
            }

            if (moveDir.sqrMagnitude > 0.01f)
            {
                if (Physics.SphereCast(origin, wallCheckRadius, moveDir, out RaycastHit sphereHit,
                    checkDist - wallCheckRadius, groundMask, QueryTriggerInteraction.Ignore))
                {
                    float angle = Vector3.Angle(Vector3.up, sphereHit.normal);

                    if (angle > maxSlopeAngle && angle < 135f)
                    {
                        isTouchingWall = true;
                        lastWallNormal = sphereHit.normal;
                        return;
                    }
                }
            }
        }
    }

    private void UpdateCrouchState()
    {
        bool wantsToCrouch = Input.GetKey(KeyCode.LeftControl);

        if (wantsToCrouch && !isSliding && isRunningInput && isGrounded &&
            lastHorizontalSpeed > minSlideStartSpeed)
        {
            StartSlide();
        }
        else if (wantsToCrouch && !isSliding)
        {
            if (!isCrouching)
                SetCrouching(true);
        }
        else if (isCrouching && !wantsToCrouch && !isSliding)
        {
            if (CanStandUp())
                SetCrouching(false);
        }

        if (isSliding)
            targetSpeed = slideSpeed;
        else if (isCrouching)
            targetSpeed = crouchSpeed;
        else
            targetSpeed = isRunningInput ? runSpeed : walkSpeed;
    }

    private void SetCrouching(bool crouch)
    {
        isCrouching = crouch;
        targetCapsuleHeight = crouch ? crouchHeight : standingHeight;

        if (cachedPlayerCamera != null)
            cachedPlayerCamera.UpdateCrouch(crouch);
    }

    private void UpdateCapsuleCollider()
    {
        currentCapsuleHeight = Mathf.Lerp(
            currentCapsuleHeight,
            targetCapsuleHeight,
            crouchSmoothSpeed * Time.fixedDeltaTime
        );

        if (Mathf.Abs(currentCapsuleHeight - targetCapsuleHeight) < 0.001f)
            currentCapsuleHeight = targetCapsuleHeight;

        capsuleCollider.height = currentCapsuleHeight;

        float newCenterY = standingBottomOffset + currentCapsuleHeight * 0.5f;
        capsuleCollider.center = new Vector3(standingCenter.x, newCenterY, standingCenter.z);
    }

    private bool CanStandUp()
    {
        float checkHeight = standingHeight - currentCapsuleHeight + standCheckHeight;
        float currentTopY = standingBottomOffset + currentCapsuleHeight;
        Vector3 checkStart = transform.position + Vector3.up * currentTopY;
        float radius = capsuleCollider.radius * 0.9f;

        return !Physics.SphereCast(checkStart, radius, Vector3.up, out _, checkHeight, groundMask, QueryTriggerInteraction.Ignore);
    }

    private void StartSlide()
    {
        Vector3 horizontalVelocity = new Vector3(rb.linearVelocity.x, 0f, rb.linearVelocity.z);
        slideDirection = horizontalVelocity.normalized;
        slideSpeed = horizontalVelocity.magnitude * slideSpeedMultiplier;
        slideControlDirection = slideDirection;

        isSliding = true;
        SetCrouching(true);

        if (cachedPlayerCamera != null)
            cachedPlayerCamera.StartSlide(slideDirection);
    }

    private void EndSlide()
    {
        isSliding = false;

        if (cachedPlayerCamera != null)
            cachedPlayerCamera.EndSlide();
    }

    private void CheckGround()
    {
        float bottomY = standingBottomOffset;
        Vector3 spherePosition = transform.position + Vector3.up * (bottomY + capsuleCollider.radius);
        float checkDistance = capsuleCollider.radius + groundCheckDistance;

        isGrounded = Physics.SphereCast(
            spherePosition, capsuleCollider.radius * 0.9f,
            Vector3.down, out groundHit,
            checkDistance, groundMask, QueryTriggerInteraction.Ignore
        );

        if (isGrounded)
        {
            float slopeAngle = Vector3.Angle(Vector3.up, groundHit.normal);

            if (slopeAngle > maxSlopeAngle)
            {
                if (slopeAngle <= maxSlideSlopeAngle)
                {
                    isGrounded = false;
                    isOnSteepSlope = true;
                    slopeSlideDirection = Vector3.ProjectOnPlane(Vector3.down, groundHit.normal).normalized;
                }
                else
                {
                    isGrounded = false;
                    isOnSteepSlope = false;
                }
            }
            else
            {
                isOnSteepSlope = false;
            }
        }
        else
        {
            isOnSteepSlope = false;
        }
    }

    private void HandleSlopeSliding()
    {
        if (!isGrounded && isOnSteepSlope && !isSliding)
        {
            Vector3 currentSlopeVelocity = Vector3.ProjectOnPlane(rb.linearVelocity, groundHit.normal);
            float currentSlopeSpeed = currentSlopeVelocity.magnitude;

            if (currentSlopeSpeed < maxSlopeSpeed)
            {
                float effectiveForce = Mathf.Lerp(
                    slopeSlideForce, slopeAcceleration,
                    Mathf.Clamp01(currentSlopeSpeed / maxSlopeSpeed)
                );
                rb.AddForce(slopeSlideDirection * effectiveForce, ForceMode.Acceleration);
            }

            Vector3 velocity = rb.linearVelocity;
            velocity.y = Mathf.Min(velocity.y, 0);
            rb.linearVelocity = velocity;
        }
    }

    private void TryStepClimb()
    {
        if (inputDirection.magnitude < 0.1f)
            return;

        Vector3 moveDir = GetWorldMoveDirection();
        float radius = capsuleCollider.radius;
        Vector3 footCheckOrigin = transform.position + Vector3.up * (standingBottomOffset + 0.05f);

        if (!Physics.Raycast(footCheckOrigin, moveDir, out RaycastHit footHit,
            radius + stepForwardDistance, groundMask, QueryTriggerInteraction.Ignore))
            return;

        float obstacleAngle = Vector3.Angle(Vector3.up, footHit.normal);

        if (obstacleAngle < 80f)
            return;

        float stepHeight = FindStepHeight(moveDir, footHit.point);

        if (stepHeight < minStepHeight || stepHeight > maxStepHeight)
            return;

        Vector3 targetPos = FindStepTargetPosition(moveDir, stepHeight);

        if (targetPos == Vector3.zero || !IsPositionClear(targetPos))
            return;

        StartStepClimb(targetPos);
    }

    private float FindStepHeight(Vector3 moveDir, Vector3 obstaclePoint)
    {
        Vector3 rayStart = obstaclePoint + moveDir * 0.1f + Vector3.up * (maxStepHeight + 0.1f);

        if (Physics.Raycast(rayStart, Vector3.down, out RaycastHit topHit,
            maxStepHeight + 0.2f, groundMask, QueryTriggerInteraction.Ignore))
        {
            float surfaceAngle = Vector3.Angle(Vector3.up, topHit.normal);

            if (surfaceAngle < maxSlopeAngle)
                return topHit.point.y - transform.position.y;
        }

        return 0f;
    }

    private Vector3 FindStepTargetPosition(Vector3 moveDir, float stepHeight)
    {
        float radius = capsuleCollider.radius;
        Vector3 targetPos = transform.position + Vector3.up * (stepHeight + 0.05f)
                            + moveDir * (radius + 0.1f);
        Vector3 groundCheckStart = targetPos + Vector3.up * 0.1f;

        if (Physics.Raycast(groundCheckStart, Vector3.down, out RaycastHit hit, 0.3f, groundMask, QueryTriggerInteraction.Ignore))
        {
            float groundAngle = Vector3.Angle(Vector3.up, hit.normal);

            if (groundAngle < maxSlopeAngle)
                return new Vector3(targetPos.x, hit.point.y + 0.02f, targetPos.z);
        }

        return Vector3.zero;
    }

    private bool IsPositionClear(Vector3 position)
    {
        float radius = capsuleCollider.radius * 0.9f;
        float height = currentCapsuleHeight;
        float bottom = standingBottomOffset;
        Vector3 point1 = position + Vector3.up * (bottom + radius);
        Vector3 point2 = position + Vector3.up * (bottom + height - radius);

        return Physics.OverlapCapsule(point1, point2, radius, groundMask, QueryTriggerInteraction.Ignore).Length == 0;
    }

    private void StartStepClimb(Vector3 targetPosition)
    {
        isClimbingStep = true;
        stepClimbStartPosition = transform.position;
        stepClimbTargetPosition = targetPosition;
        stepClimbTimer = 0f;
        stepClimbVelocityCache = rb.linearVelocity;
        rb.linearVelocity = Vector3.zero;
    }

    private void ProcessStepClimb()
    {
        stepClimbTimer += Time.fixedDeltaTime;
        float progress = Mathf.Clamp01(stepClimbTimer / stepClimbDuration);
        float smoothProgress = Mathf.SmoothStep(0f, 1f, progress);

        Vector3 newPos;

        if (smoothProgress < 0.5f)
        {
            float liftProgress = smoothProgress / 0.5f;
            float targetY = Mathf.Lerp(stepClimbStartPosition.y, stepClimbTargetPosition.y, liftProgress);
            newPos = new Vector3(stepClimbStartPosition.x, targetY, stepClimbStartPosition.z);
        }
        else
        {
            float forwardProgress = (smoothProgress - 0.5f) / 0.5f;
            newPos = new Vector3(
                Mathf.Lerp(stepClimbStartPosition.x, stepClimbTargetPosition.x, forwardProgress),
                stepClimbTargetPosition.y,
                Mathf.Lerp(stepClimbStartPosition.z, stepClimbTargetPosition.z, forwardProgress)
            );
        }

        transform.position = newPos;

        if (progress >= 1f)
        {
            transform.position = stepClimbTargetPosition;
            isClimbingStep = false;
            rb.linearVelocity = new Vector3(
                stepClimbVelocityCache.x * 0.8f, 0f,
                stepClimbVelocityCache.z * 0.8f
            );
        }
    }

    private void UpdateMovement()
    {
        if (isOnLadder)
        {
            HandleLadderMovement();
        }
        else if (isSliding)
        {
            HandleSlide();
        }
        else
        {
            HandleNormalMovement();
        }
    }

    private void HandleLadderMovement()
    {
        if (currentLadderCollider == null) return;

        Bounds bounds = currentLadderCollider.bounds;
        ladderTopPoint = new Vector3(bounds.center.x, bounds.max.y, bounds.center.z);
        ladderBottomPoint = new Vector3(bounds.center.x, bounds.min.y, bounds.center.z);

        Vector3 movement = Vector3.up * ladderVerticalInput * ladderClimbSpeed * Time.fixedDeltaTime;
        Vector3 newPosition = transform.position + movement;

        newPosition.y = Mathf.Clamp(newPosition.y, ladderBottomPoint.y, ladderTopPoint.y);

        rb.MovePosition(newPosition);

        if (newPosition.y >= ladderTopPoint.y - 0.1f && ladderVerticalInput > 0)
        {
            Vector3 exitPos = transform.position + ladderForwardDirection * ladderExitOffset;
            rb.MovePosition(exitPos);
            ExitLadder();
        }
        else if (newPosition.y <= ladderBottomPoint.y + 0.1f && ladderVerticalInput < 0)
        {
            ExitLadder();
        }

        if (rb != null && !rb.isKinematic)
        {
            rb.linearVelocity = Vector3.zero;
        }
    }

    private void HandleSlide()
    {
        if (!isGrounded && !isOnSteepSlope)
        {
            EndSlide();
            return;
        }

        if (inputDirection.magnitude > 0.1f)
        {
            Vector3 controlDirection = GetWorldMoveDirection();

            if (controlDirection.sqrMagnitude > 0.01f)
            {
                if (isTouchingWall && Vector3.Dot(controlDirection, lastWallNormal) < 0)
                    controlDirection = Vector3.ProjectOnPlane(controlDirection, lastWallNormal).normalized;

                slideControlDirection = Vector3.Lerp(
                    slideControlDirection, controlDirection,
                    slideControl * Time.fixedDeltaTime
                ).normalized;
            }
        }

        slideSpeed = Mathf.Max(slideMinSpeed, slideSpeed - slideDeceleration * Time.fixedDeltaTime);

        if (slideSpeed <= slideMinSpeed * 1.1f)
        {
            EndSlide();
            return;
        }

        Vector3 moveDirection = slideControlDirection.sqrMagnitude > 0.01f
            ? slideControlDirection : fixedRotation * Vector3.forward;

        if (isTouchingWall && Vector3.Dot(moveDirection, lastWallNormal) < 0)
            moveDirection = Vector3.ProjectOnPlane(moveDirection, lastWallNormal).normalized;

        if ((isGrounded || isOnSteepSlope) && groundHit.normal != Vector3.up)
            moveDirection = ProjectDirectionOnSlope(moveDirection, groundHit.normal);

        rb.linearVelocity = new Vector3(
            moveDirection.x * slideSpeed,
            rb.linearVelocity.y,
            moveDirection.z * slideSpeed
        );
    }

    private void HandleNormalMovement()
    {
        Vector3 moveDirection = GetWorldMoveDirection();

        if (isTouchingWall && moveDirection.sqrMagnitude > 0.01f)
        {
            float dotProduct = Vector3.Dot(moveDirection, -lastWallNormal);

            if (dotProduct > 0.1f)
            {
                moveDirection = Vector3.ProjectOnPlane(moveDirection, lastWallNormal);

                if (moveDirection.sqrMagnitude < 0.01f)
                    moveDirection = Vector3.zero;
                else
                    moveDirection = moveDirection.normalized;

                Vector3 currentHorizontalVel = new Vector3(rb.linearVelocity.x, 0, rb.linearVelocity.z);
                float velocityIntoWall = Vector3.Dot(currentHorizontalVel, -lastWallNormal);

                if (velocityIntoWall > 0)
                {
                    Vector3 correctedVelocity = Vector3.ProjectOnPlane(currentHorizontalVel, lastWallNormal);
                    rb.linearVelocity = new Vector3(
                        correctedVelocity.x, rb.linearVelocity.y, correctedVelocity.z
                    );
                }
            }
        }

        if (isGrounded && groundHit.normal != Vector3.up && moveDirection.sqrMagnitude > 0.01f)
            moveDirection = ProjectDirectionOnSlope(moveDirection, groundHit.normal);

        Vector3 targetVelocity = moveDirection * targetSpeed;
        float controlFactor = (isGrounded || isOnSteepSlope) ? 1f : airControlFactor;

        if (moveDirection.sqrMagnitude > 0.01f)
        {
            currentVelocity.x = Mathf.Lerp(
                currentVelocity.x, targetVelocity.x,
                acceleration * controlFactor * Time.fixedDeltaTime
            );
            currentVelocity.z = Mathf.Lerp(
                currentVelocity.z, targetVelocity.z,
                acceleration * controlFactor * Time.fixedDeltaTime
            );
        }
        else
        {
            float deceleration = acceleration * 1.5f * Time.fixedDeltaTime;
            currentVelocity.x = Mathf.Lerp(currentVelocity.x, 0f, deceleration);
            currentVelocity.z = Mathf.Lerp(currentVelocity.z, 0f, deceleration);
        }

        currentVelocity.y = rb.linearVelocity.y;

        if (isTouchingWall)
        {
            Vector3 horizontalVelocity = new Vector3(currentVelocity.x, 0, currentVelocity.z);
            float intoWall = Vector3.Dot(horizontalVelocity, -lastWallNormal);

            if (intoWall > 0)
            {
                Vector3 alongWall = Vector3.ProjectOnPlane(horizontalVelocity, lastWallNormal);
                currentVelocity.x = alongWall.x;
                currentVelocity.z = alongWall.z;
            }
        }

        rb.linearVelocity = currentVelocity;
    }

    private Vector3 ProjectDirectionOnSlope(Vector3 direction, Vector3 slopeNormal)
    {
        Vector3 projected = Vector3.ProjectOnPlane(direction, slopeNormal);
        float slopeAngle = Vector3.Angle(Vector3.up, slopeNormal);

        if (slopeAngle <= maxSlopeAngle)
        {
            if (projected.y < 0)
                projected.y = 0;
        }
        else
        {
            projected.y = Mathf.Min(projected.y, 0);
        }

        return projected.normalized;
    }

    private void Jump()
    {
        if (isOnLadder) return;

        rb.linearVelocity = new Vector3(rb.linearVelocity.x, 0f, rb.linearVelocity.z);
        rb.AddForce(Vector3.up * jumpForce, ForceMode.VelocityChange);

        if (isSliding)
            EndSlide();

        if (cachedPlayerCamera != null)
            cachedPlayerCamera.TriggerJump();
    }

    public void EnterLadder(Collider ladderCollider)
    {
        if (isOnLadder) return;

        isOnLadder = true;
        currentLadderCollider = ladderCollider;

        if (rb != null)
        {
            rb.isKinematic = true;
            rb.useGravity = false;
            rb.linearVelocity = Vector3.zero;
        }

        Bounds bounds = ladderCollider.bounds;
        ladderTopPoint = new Vector3(bounds.center.x, bounds.max.y, bounds.center.z);
        ladderBottomPoint = new Vector3(bounds.center.x, bounds.min.y, bounds.center.z);

        Vector3 directionToLadder = ladderCollider.transform.position - transform.position;
        directionToLadder.y = 0;

        if (directionToLadder != Vector3.zero)
        {
            ladderForwardDirection = directionToLadder.normalized;
        }
        else
        {
            ladderForwardDirection = transform.forward;
        }
    }

    public void ExitLadder()
    {
        if (!isOnLadder) return;

        isOnLadder = false;
        currentLadderCollider = null;

        if (rb != null)
        {
            rb.isKinematic = false;
            rb.useGravity = true;
        }
    }

    public bool IsOnLadder()
    {
        return isOnLadder;
    }

    public void SetCurrentRotation(Quaternion rotation)
    {
        currentRotation = rotation;
    }

    public void SetControlsEnabled(bool enabled)
    {
        controlsEnabled = enabled;

        if (!enabled)
        {
            inputDirection = Vector2.zero;
            rawInputDirection = Vector2.zero;
            isRunningInput = false;
            jumpRequested = false;

            if (isSliding)
                EndSlide();
        }
    }

    public bool AreControlsEnabled()
    {
        return controlsEnabled;
    }

    public void StopMovement()
    {
        if (rb != null)
        {
            rb.linearVelocity = Vector3.zero;
            rb.angularVelocity = Vector3.zero;
        }
        currentVelocity = Vector3.zero;
        lastHorizontalSpeed = 0f;
    }

    public void TeleportTo(Vector3 position, Quaternion rotation)
    {
        if (rb != null)
        {
            rb.linearVelocity = Vector3.zero;
            rb.angularVelocity = Vector3.zero;
        }

        transform.position = position;
        transform.rotation = rotation;
        currentRotation = rotation;
        fixedRotation = rotation;

        currentVelocity = Vector3.zero;
        lastHorizontalSpeed = 0f;
    }

    public Rigidbody GetRigidbody()
    {
        return rb;
    }

    public bool IsGrounded()
    {
        return isGrounded && !isOnLadder;
    }

    public float GetCurrentSpeed()
    {
        return lastHorizontalSpeed;
    }

    public float GetTargetSpeed()
    {
        return targetSpeed;
    }

    public float GetWalkSpeed()
    {
        return walkSpeed;
    }

    public float GetRunSpeed()
    {
        return runSpeed;
    }

    public float GetCrouchSpeed()
    {
        return crouchSpeed;
    }

    public bool IsRunning()
    {
        return isRunningInput && isGrounded && !isCrouching && !isSliding && !isOnLadder;
    }

    public bool IsCrouching()
    {
        return isCrouching;
    }

    public bool IsSliding()
    {
        return isSliding;
    }

    public float GetVerticalVelocity()
    {
        if (rb != null)
            return rb.linearVelocity.y;
        return 0f;
    }

    public Vector3 GetVelocity()
    {
        if (rb != null)
            return rb.linearVelocity;
        return Vector3.zero;
    }

    public bool IsTouchingWall()
    {
        return isTouchingWall;
    }

    public bool IsActuallyMoving()
    {
        return lastHorizontalSpeed > 0.5f;
    }

    public bool IsClimbingStep()
    {
        return isClimbingStep;
    }

    public float GetCurrentCapsuleHeight()
    {
        return currentCapsuleHeight;
    }

    public float GetStandingHeight()
    {
        return standingHeight;
    }
}

public class LadderTriggerHandlerMovement : MonoBehaviour
{
    private PlayerMovement playerMovement;
    private LayerMask ladderLayer;
    private Collider currentLadder;
    
    public void Initialize(PlayerMovement movement, LayerMask layer)
    {
        playerMovement = movement;
        ladderLayer = layer;
    }
    
    private void OnTriggerStay(Collider other)
    {
        if (playerMovement != null && ((1 << other.gameObject.layer) & ladderLayer) != 0)
        {
            if (!playerMovement.IsOnLadder() && currentLadder == null)
            {
                currentLadder = other;
                playerMovement.EnterLadder(other);
            }
        }
    }
    
    private void OnTriggerExit(Collider other)
    {
        if (playerMovement != null && ((1 << other.gameObject.layer) & ladderLayer) != 0)
        {
            if (playerMovement.IsOnLadder())
            {
                currentLadder = null;
                playerMovement.ExitLadder();
            }
        }
    }
}