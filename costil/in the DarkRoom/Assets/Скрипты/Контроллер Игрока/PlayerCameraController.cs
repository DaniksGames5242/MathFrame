using UnityEngine;

namespace HorrorFirstPersonController
{
    public class PlayerCameraController : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private Camera playerCameraComponent;
        [SerializeField] private PlayerCamera playerCameraScript;

        private float rotX = 0f;
        private float rotY = 0f;
        private float xVelocity = 0f;
        private float yVelocity = 0f;

        private bool isControlEnabled = true;

        private Vector3 initialLocalPosition;
        private Quaternion initialLocalRotation;
        private Transform initialParent;
        private bool hasInitialized = false;

        public Camera PlayerCamera
        {
            get { return playerCameraComponent; }
        }

        private void Awake()
        {
            if (playerCameraComponent == null)
                playerCameraComponent = GetComponent<Camera>();

            if (playerCameraComponent == null)
                playerCameraComponent = GetComponentInChildren<Camera>();

            if (playerCameraScript == null)
                playerCameraScript = GetComponent<PlayerCamera>();

            if (playerCameraScript == null)
                playerCameraScript = GetComponentInParent<PlayerCamera>();
        }

        private void Start()
        {
            SaveInitialState();

            if (playerCameraScript != null)
            {
                rotX = playerCameraScript.GetYawRotation();
                rotY = playerCameraScript.GetPitchRotation();
                xVelocity = rotX;
                yVelocity = rotY;
            }
        }

        private void SaveInitialState()
        {
            if (!hasInitialized)
            {
                initialParent = transform.parent;
                initialLocalPosition = transform.localPosition;
                initialLocalRotation = transform.localRotation;
                hasInitialized = true;
            }
        }

        public void SetControlEnabled(bool enabled)
        {
            isControlEnabled = enabled;

            if (playerCameraScript != null)
                playerCameraScript.SetControlsEnabled(enabled);
        }

        public void ResetCamera()
        {
            if (playerCameraScript != null)
            {
                rotX = playerCameraScript.GetYawRotation();
                rotY = playerCameraScript.GetPitchRotation();
                xVelocity = rotX;
                yVelocity = rotY;
            }
        }

        public void ResetToInitialState()
        {
            if (hasInitialized && initialParent != null)
            {
                transform.SetParent(initialParent, false);
                transform.localPosition = initialLocalPosition;
                transform.localRotation = initialLocalRotation;
            }

            ResetCamera();
        }

        public void SetRotation(float yaw, float pitch)
        {
            rotX = yaw;
            rotY = pitch;
            xVelocity = yaw;
            yVelocity = pitch;

            if (playerCameraScript != null)
                playerCameraScript.SetRotation(pitch, yaw);
        }

        public float GetYawRotation()
        {
            if (playerCameraScript != null)
                return playerCameraScript.GetYawRotation();

            return rotX;
        }

        public float GetPitchRotation()
        {
            if (playerCameraScript != null)
                return playerCameraScript.GetPitchRotation();

            return rotY;
        }

        public Camera GetCamera()
        {
            return playerCameraComponent;
        }

        public Transform GetCameraTransform()
        {
            if (playerCameraComponent != null)
                return playerCameraComponent.transform;

            return transform;
        }

        public Vector3 GetInitialLocalPosition()
        {
            return initialLocalPosition;
        }

        public Quaternion GetInitialLocalRotation()
        {
            return initialLocalRotation;
        }

        public Transform GetInitialParent()
        {
            return initialParent;
        }
    }
}