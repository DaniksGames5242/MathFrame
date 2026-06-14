using UnityEngine;

namespace HorrorFirstPersonController
{
    [RequireComponent(typeof(PlayerMovement))]
    public class PlayerController : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private PlayerMovement playerMovement;
        [SerializeField] private PlayerCamera playerCamera;
        [SerializeField] private PlayerCameraController cameraController;
        [SerializeField] private Transform cameraHolder;

        private bool isControlEnabled = true;
        private Vector3 originalCameraLocalPosition;
        private Quaternion originalCameraLocalRotation;
        private Transform originalCameraParent;
        private bool hasSavedCameraState = false;

        private PlayerFootstepSounds footstepSounds;
        private bool wasCameraChild = true;

        public PlayerCameraController CameraController
        {
            get { return cameraController; }
        }

        public PlayerMovement Movement
        {
            get { return playerMovement; }
        }

        public PlayerCamera Camera
        {
            get { return playerCamera; }
        }

        public Transform CameraHolder
        {
            get { return cameraHolder; }
        }

        private void Awake()
        {
            if (playerMovement == null)
                playerMovement = GetComponent<PlayerMovement>();

            if (playerCamera == null)
                playerCamera = GetComponentInChildren<PlayerCamera>();

            if (cameraController == null)
                cameraController = GetComponentInChildren<PlayerCameraController>();

            if (cameraController == null && playerCamera != null)
                cameraController = playerCamera.gameObject.AddComponent<PlayerCameraController>();

            if (cameraHolder == null && playerCamera != null)
                cameraHolder = playerCamera.transform.parent;

            footstepSounds = GetComponent<PlayerFootstepSounds>();

            SaveCameraState();
        }

        private void Update()
        {
            bool isCameraChild = IsCameraChildOfPlayer();
            if (isCameraChild != wasCameraChild)
            {
                SetControl(isCameraChild);
                if (footstepSounds != null)
                    footstepSounds.SetEnabled(isCameraChild);
                wasCameraChild = isCameraChild;
            }
        }

        private bool IsCameraChildOfPlayer()
        {
            Transform camTransform = GetCameraTransform();
            if (camTransform == null) return false;
            return camTransform.IsChildOf(transform);
        }

        private void SaveCameraState()
        {
            if (playerCamera != null && !hasSavedCameraState)
            {
                originalCameraParent = playerCamera.transform.parent;
                originalCameraLocalPosition = playerCamera.transform.localPosition;
                originalCameraLocalRotation = playerCamera.transform.localRotation;
                hasSavedCameraState = true;
            }
        }

        public void SetControl(bool enabled)
        {
            isControlEnabled = enabled;

            if (playerMovement != null)
            {
                playerMovement.SetControlsEnabled(enabled);

                if (!enabled)
                    playerMovement.StopMovement();
            }

            if (playerCamera != null)
                playerCamera.SetControlsEnabled(enabled);

            if (cameraController != null)
                cameraController.SetControlEnabled(enabled);
        }

        public bool IsControlEnabled()
        {
            return isControlEnabled;
        }

        public void TeleportTo(Vector3 position, Quaternion rotation)
        {
            if (playerMovement != null)
                playerMovement.TeleportTo(position, rotation);
            else
            {
                transform.position = position;
                transform.rotation = rotation;
            }
        }

        public void ResetCameraToPlayer()
        {
            if (playerCamera == null)
                return;

            if (hasSavedCameraState && originalCameraParent != null)
            {
                playerCamera.transform.SetParent(originalCameraParent, false);
                playerCamera.transform.localPosition = originalCameraLocalPosition;
                playerCamera.transform.localRotation = originalCameraLocalRotation;
            }
            else if (cameraHolder != null)
            {
                playerCamera.transform.SetParent(cameraHolder, false);
                playerCamera.transform.localPosition = Vector3.zero;
                playerCamera.transform.localRotation = Quaternion.identity;
            }

            if (cameraController != null)
                cameraController.ResetCamera();
        }

        public void SaveCurrentCameraState()
        {
            if (playerCamera != null)
            {
                originalCameraParent = playerCamera.transform.parent;
                originalCameraLocalPosition = playerCamera.transform.localPosition;
                originalCameraLocalRotation = playerCamera.transform.localRotation;
                hasSavedCameraState = true;
            }
        }

        public Vector3 GetOriginalCameraLocalPosition()
        {
            return originalCameraLocalPosition;
        }

        public Quaternion GetOriginalCameraLocalRotation()
        {
            return originalCameraLocalRotation;
        }

        public Transform GetOriginalCameraParent()
        {
            return originalCameraParent;
        }

        public Rigidbody GetRigidbody()
        {
            if (playerMovement != null)
                return playerMovement.GetRigidbody();

            return GetComponent<Rigidbody>();
        }

        public float GetCurrentSpeed()
        {
            if (playerMovement != null)
                return playerMovement.GetCurrentSpeed();

            return 0f;
        }

        public bool IsGrounded()
        {
            if (playerMovement != null)
                return playerMovement.IsGrounded();

            return false;
        }

        public UnityEngine.Camera GetCamera()
        {
            if (playerCamera != null)
                return playerCamera.GetCamera();

            return null;
        }

        public Transform GetCameraTransform()
        {
            if (playerCamera != null)
                return playerCamera.GetCameraTransform();

            return null;
        }

        public void SetCrouch(bool crouch)
        {
            if (playerCamera != null)
                playerCamera.UpdateCrouch(crouch);
        }
    }
}