using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using System.Collections;
using System.Collections.Generic;

[RequireComponent(typeof(Button))]
public class AdvancedMenuButton : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler, IPointerDownHandler
{
    [Header("Компоненты кнопки")]
    public Image backgroundImage;
    public Image innerSprite;
    public List<RectTransform> sticks;
    
    [Header("Настройки анимаций наведения")]
    public List<HoverAnimationSetting> hoverAnimations = new List<HoverAnimationSetting>();
    
    [Header("Настройки анимаций нажатия")]
    public List<ClickAnimationSetting> clickAnimations = new List<ClickAnimationSetting>();
    
    [Header("Глобальные настройки")]
    public bool hideAfterClick = true;
    public float transitionDuration = 0.15f;
    
    public enum HoverAnimationType
    {
        ScaleBounce,
        ScaleButtonShrinkInner,
        SticksSpread,
        ColorHighlight,
        WiggleRotation,
        SticksRotate
    }
    
    public enum ClickAnimationType
    {
        PunchScale,
        ShrinkAll,
        SticksShift,
        BorderInnerSwap,
        FlashShrink,
        RotatePunch
    }
    
    [System.Serializable]
    public class HoverAnimationSetting
    {
        public HoverAnimationType type;
        public bool enabled = true;
        
        public float duration = 0.2f;
        public AnimationCurve curve = AnimationCurve.EaseInOut(0, 0, 1, 1);
        
        public float scaleMultiplier = 1.1f;
        public float innerScaleMultiplier = 0.9f;
        public float bounceOvershoot = 1.2f;
        public float sticksSpreadDistance = 30f;
        public Color highlightColor = new Color(1f, 0.95f, 0.8f);
        public float colorIntensity = 0.3f;
        public float wiggleAngle = 5f;
        public float wiggleSpeed = 30f;
        
        public HoverAnimationSetting()
        {
            duration = 0.2f;
            curve = AnimationCurve.EaseInOut(0, 0, 1, 1);
            scaleMultiplier = 1.1f;
            innerScaleMultiplier = 0.9f;
            bounceOvershoot = 1.2f;
            sticksSpreadDistance = 30f;
            highlightColor = new Color(1f, 0.95f, 0.8f);
            colorIntensity = 0.3f;
            wiggleAngle = 5f;
            wiggleSpeed = 30f;
        }
        
        public HoverAnimationSetting(HoverAnimationType animationType) : this()
        {
            type = animationType;
        }
    }
    
    [System.Serializable]
    public class ClickAnimationSetting
    {
        public ClickAnimationType type;
        public bool enabled = true;
        
        public float duration = 0.15f;
        public AnimationCurve curve = AnimationCurve.EaseInOut(0, 0, 1, 1);
        
        public float punchScale = 1.2f;
        public float shrinkScale = 0.85f;
        public float sticksShiftDistance = 20f;
        public float borderScale = 1.15f;
        public float innerShrinkScale = 0.8f;
        public float rotationAngle = 15f;
        
        public ClickAnimationSetting()
        {
            duration = 0.15f;
            curve = AnimationCurve.EaseInOut(0, 0, 1, 1);
            punchScale = 1.2f;
            shrinkScale = 0.85f;
            sticksShiftDistance = 20f;
            borderScale = 1.15f;
            innerShrinkScale = 0.8f;
            rotationAngle = 15f;
        }
        
        public ClickAnimationSetting(ClickAnimationType animationType) : this()
        {
            type = animationType;
        }
    }
    
    private Vector3 originalScale;
    private Vector3 originalInnerScale;
    private List<Vector3> originalStickScales = new List<Vector3>();
    private List<Vector2> originalStickPositions = new List<Vector2>();
    private List<Quaternion> originalStickRotations = new List<Quaternion>();
    private Color originalBgColor;
    private Color originalInnerColor;
    private Vector3 originalBgScale;
    
    private Button button;
    private Coroutine currentAnimation;
    private bool isHovering = false;
    private bool isClicking = false;
    private bool isHidden = false;
    
    void Awake()
    {
        button = GetComponent<Button>();
        originalScale = transform.localScale;
        
        if (backgroundImage != null)
        {
            originalBgColor = backgroundImage.color;
            originalBgScale = backgroundImage.rectTransform.localScale;
        }
        if (innerSprite != null)
        {
            originalInnerScale = innerSprite.rectTransform.localScale;
            originalInnerColor = innerSprite.color;
        }
        
        foreach (var stick in sticks)
        {
            if (stick != null)
            {
                originalStickScales.Add(stick.localScale);
                originalStickPositions.Add(stick.anchoredPosition);
                originalStickRotations.Add(stick.localRotation);
            }
        }
        
        InitializeDefaultAnimations();
    }
    
    void InitializeDefaultAnimations()
    {
        if (hoverAnimations == null || hoverAnimations.Count == 0)
        {
            hoverAnimations = new List<HoverAnimationSetting>();
            
            var scaleBounce = new HoverAnimationSetting(HoverAnimationType.ScaleBounce);
            scaleBounce.enabled = true;
            hoverAnimations.Add(scaleBounce);
            
            var colorHighlight = new HoverAnimationSetting(HoverAnimationType.ColorHighlight);
            colorHighlight.enabled = true;
            hoverAnimations.Add(colorHighlight);
        }
        else
        {
            foreach (var setting in hoverAnimations)
            {
                if (setting.duration == 0) setting.duration = 0.2f;
                if (setting.curve == null || setting.curve.keys.Length == 0) 
                    setting.curve = AnimationCurve.EaseInOut(0, 0, 1, 1);
                if (setting.scaleMultiplier == 0) setting.scaleMultiplier = 1.1f;
                if (setting.innerScaleMultiplier == 0) setting.innerScaleMultiplier = 0.9f;
                if (setting.bounceOvershoot == 0) setting.bounceOvershoot = 1.2f;
                if (setting.sticksSpreadDistance == 0) setting.sticksSpreadDistance = 30f;
                if (setting.colorIntensity == 0) setting.colorIntensity = 0.3f;
                if (setting.wiggleAngle == 0) setting.wiggleAngle = 5f;
                if (setting.wiggleSpeed == 0) setting.wiggleSpeed = 30f;
            }
        }
        
        if (clickAnimations == null || clickAnimations.Count == 0)
        {
            clickAnimations = new List<ClickAnimationSetting>();
            
            var punchScale = new ClickAnimationSetting(ClickAnimationType.PunchScale);
            punchScale.enabled = true;
            clickAnimations.Add(punchScale);
            
            var shrinkAll = new ClickAnimationSetting(ClickAnimationType.ShrinkAll);
            shrinkAll.enabled = true;
            clickAnimations.Add(shrinkAll);
        }
        else
        {
            foreach (var setting in clickAnimations)
            {
                if (setting.duration == 0) setting.duration = 0.15f;
                if (setting.curve == null || setting.curve.keys.Length == 0) 
                    setting.curve = AnimationCurve.EaseInOut(0, 0, 1, 1);
                if (setting.punchScale == 0) setting.punchScale = 1.2f;
                if (setting.shrinkScale == 0) setting.shrinkScale = 0.85f;
                if (setting.sticksShiftDistance == 0) setting.sticksShiftDistance = 20f;
                if (setting.borderScale == 0) setting.borderScale = 1.15f;
                if (setting.innerShrinkScale == 0) setting.innerShrinkScale = 0.8f;
                if (setting.rotationAngle == 0) setting.rotationAngle = 15f;
            }
        }
    }
    
    void OnEnable()
    {
        isHidden = false;
        isClicking = false;
        ResetAllToOriginal();
    }
    
    void ResetAllToOriginal()
    {
        if (currentAnimation != null) StopCoroutine(currentAnimation);
        
        transform.localScale = originalScale;
        transform.localRotation = Quaternion.identity;
        
        if (backgroundImage != null)
        {
            backgroundImage.color = originalBgColor;
            backgroundImage.rectTransform.localScale = originalBgScale;
        }
        
        if (innerSprite != null)
        {
            innerSprite.rectTransform.localScale = originalInnerScale;
            innerSprite.color = originalInnerColor;
        }
        
        for (int i = 0; i < sticks.Count && i < originalStickScales.Count; i++)
        {
            if (sticks[i] != null)
            {
                sticks[i].localScale = originalStickScales[i];
                sticks[i].anchoredPosition = originalStickPositions[i];
                sticks[i].localRotation = originalStickRotations[i];
            }
        }
    }
    
    public void OnPointerEnter(PointerEventData eventData)
    {
        if (!button.interactable || isHidden || isClicking) return;
        isHovering = true;
        
        if (currentAnimation != null) StopCoroutine(currentAnimation);
        currentAnimation = StartCoroutine(SmoothTransitionToHover(true));
    }
    
    public void OnPointerExit(PointerEventData eventData)
    {
        if (!button.interactable || isHidden || isClicking) return;
        isHovering = false;
        
        if (currentAnimation != null) StopCoroutine(currentAnimation);
        currentAnimation = StartCoroutine(SmoothTransitionToHover(false));
    }
    
    public void OnPointerDown(PointerEventData eventData)
    {
        if (!button.interactable || isHidden || isClicking) return;
        StartCoroutine(PlayClickAndHide());
    }
    
    IEnumerator SmoothTransitionToHover(bool toHoverState)
    {
        Dictionary<string, float> startValues = new Dictionary<string, float>();
        Dictionary<string, float> endValues = new Dictionary<string, float>();
        
        float targetButtonScale = originalScale.x;
        float targetInnerScale = originalInnerScale.x;
        Color targetBgColor = originalBgColor;
        List<Vector2> targetStickPositions = new List<Vector2>();
        
        float startButtonScale = transform.localScale.x;
        float startInnerScale = innerSprite != null ? innerSprite.rectTransform.localScale.x : originalInnerScale.x;
        Color startBgColor = backgroundImage != null ? backgroundImage.color : originalBgColor;
        List<Vector2> startStickPositions = new List<Vector2>();
        
        for (int i = 0; i < sticks.Count; i++)
        {
            if (sticks[i] != null)
            {
                startStickPositions.Add(sticks[i].anchoredPosition);
                targetStickPositions.Add(originalStickPositions[i]);
            }
        }
        
        if (toHoverState)
        {
            foreach (var setting in hoverAnimations)
            {
                if (!setting.enabled) continue;
                
                switch (setting.type)
                {
                    case HoverAnimationType.ScaleBounce:
                    case HoverAnimationType.ScaleButtonShrinkInner:
                        targetButtonScale = originalScale.x * setting.scaleMultiplier;
                        if (setting.type == HoverAnimationType.ScaleButtonShrinkInner)
                            targetInnerScale = originalInnerScale.x * setting.innerScaleMultiplier;
                        break;
                        
                    case HoverAnimationType.ColorHighlight:
                        targetBgColor = Color.Lerp(originalBgColor, setting.highlightColor, setting.colorIntensity);
                        break;
                        
                    case HoverAnimationType.SticksSpread:
                        if (sticks.Count >= 3)
                        {
                            for (int i = 0; i < sticks.Count; i++)
                            {
                                if (i == 0)
                                    targetStickPositions[i] = originalStickPositions[i] + Vector2.up * setting.sticksSpreadDistance;
                                else if (i == sticks.Count - 1)
                                    targetStickPositions[i] = originalStickPositions[i] + Vector2.down * setting.sticksSpreadDistance;
                                else
                                    targetStickPositions[i] = originalStickPositions[i];
                            }
                        }
                        break;
                }
            }
        }
        
        float elapsed = 0;
        while (elapsed < transitionDuration)
        {
            float t = elapsed / transitionDuration;
            float easedT = Mathf.SmoothStep(0, 1, t);
            
            float currentButtonScale = Mathf.Lerp(startButtonScale, targetButtonScale, easedT);
            transform.localScale = new Vector3(currentButtonScale, currentButtonScale, currentButtonScale);
            
            if (innerSprite != null)
            {
                float currentInnerScale = Mathf.Lerp(startInnerScale, targetInnerScale, easedT);
                innerSprite.rectTransform.localScale = new Vector3(currentInnerScale, currentInnerScale, currentInnerScale);
            }
            
            if (backgroundImage != null)
            {
                backgroundImage.color = Color.Lerp(startBgColor, targetBgColor, easedT);
            }
            
            for (int i = 0; i < sticks.Count && i < startStickPositions.Count; i++)
            {
                if (sticks[i] != null)
                {
                    sticks[i].anchoredPosition = Vector2.Lerp(startStickPositions[i], targetStickPositions[i], easedT);
                }
            }
            
            elapsed += Time.deltaTime;
            yield return null;
        }
        
        transform.localScale = new Vector3(targetButtonScale, targetButtonScale, targetButtonScale);
        if (innerSprite != null) innerSprite.rectTransform.localScale = new Vector3(targetInnerScale, targetInnerScale, targetInnerScale);
        if (backgroundImage != null) backgroundImage.color = targetBgColor;
        for (int i = 0; i < sticks.Count && i < targetStickPositions.Count; i++)
        {
            if (sticks[i] != null) sticks[i].anchoredPosition = targetStickPositions[i];
        }
        
        currentAnimation = null;
    }
    
    IEnumerator PlayClickAndHide()
    {
        if (isClicking) yield break;
        isClicking = true;
        button.interactable = false;
        
        if (currentAnimation != null) StopCoroutine(currentAnimation);
        
        yield return StartCoroutine(SmoothClickAnimation());
        
        if (hideAfterClick)
        {
            isHidden = true;
            gameObject.SetActive(false);
        }
        else
        {
            button.interactable = true;
            isClicking = false;
            
            if (isHovering)
            {
                currentAnimation = StartCoroutine(SmoothTransitionToHover(true));
            }
            else
            {
                ResetAllToOriginal();
            }
        }
    }
    
    IEnumerator SmoothClickAnimation()
    {
        float elapsed = 0;
        float clickDuration = 0.2f;
        
        Vector3 startScale = transform.localScale;
        Vector3 startInnerScale = innerSprite != null ? innerSprite.rectTransform.localScale : Vector3.one;
        List<Vector2> startStickPositions = new List<Vector2>();
        List<Vector3> startStickScales = new List<Vector3>();
        
        foreach (var stick in sticks)
        {
            if (stick != null)
            {
                startStickPositions.Add(stick.anchoredPosition);
                startStickScales.Add(stick.localScale);
            }
        }
        
        Color startBgColor = backgroundImage != null ? backgroundImage.color : Color.white;
        Vector3 startBgScale = backgroundImage != null ? backgroundImage.rectTransform.localScale : Vector3.one;
        
        while (elapsed < clickDuration * 0.5f)
        {
            float t = elapsed / (clickDuration * 0.5f);
            float easedT = Mathf.SmoothStep(0, 1, t);
            
            Vector3 targetScale = startScale;
            Vector3 targetInnerScale = startInnerScale;
            Vector3 targetBgScale = startBgScale;
            Color targetBgColor = startBgColor;
            
            foreach (var setting in clickAnimations)
            {
                if (!setting.enabled) continue;
                
                switch (setting.type)
                {
                    case ClickAnimationType.PunchScale:
                        targetScale = originalScale * Mathf.Lerp(1f, setting.punchScale, easedT);
                        break;
                        
                    case ClickAnimationType.ShrinkAll:
                        float shrinkFactor = Mathf.Lerp(1f, setting.shrinkScale, easedT);
                        targetScale = originalScale * shrinkFactor;
                        targetInnerScale = originalInnerScale * shrinkFactor;
                        for (int i = 0; i < sticks.Count; i++)
                            if (sticks[i] != null && i < originalStickScales.Count)
                                sticks[i].localScale = originalStickScales[i] * shrinkFactor;
                        break;
                        
                    case ClickAnimationType.SticksShift:
                        for (int i = 0; i < sticks.Count; i++)
                        {
                            if (sticks[i] != null && i < startStickPositions.Count)
                            {
                                float shift = Mathf.Lerp(0, (i % 2 == 0 ? setting.sticksShiftDistance : -setting.sticksShiftDistance), easedT);
                                sticks[i].anchoredPosition = startStickPositions[i] + new Vector2(shift, 0);
                            }
                        }
                        break;
                        
                    case ClickAnimationType.BorderInnerSwap:
                        if (backgroundImage != null)
                            targetBgScale = originalBgScale * Mathf.Lerp(1f, setting.borderScale, easedT);
                        targetInnerScale = originalInnerScale * Mathf.Lerp(1f, setting.innerShrinkScale, easedT);
                        break;
                        
                    case ClickAnimationType.FlashShrink:
                        if (backgroundImage != null)
                            targetBgColor = Color.Lerp(originalBgColor, Color.white, easedT);
                        float flashShrinkFactor = Mathf.Lerp(1f, setting.shrinkScale, easedT);
                        targetScale = originalScale * flashShrinkFactor;
                        targetInnerScale = originalInnerScale * flashShrinkFactor;
                        break;
                        
                    case ClickAnimationType.RotatePunch:
                        float angle = Mathf.Lerp(0, setting.rotationAngle, easedT);
                        transform.localRotation = Quaternion.Euler(0, 0, angle);
                        break;
                }
            }
            
            transform.localScale = Vector3.Lerp(startScale, targetScale, easedT);
            if (innerSprite != null) innerSprite.rectTransform.localScale = Vector3.Lerp(startInnerScale, targetInnerScale, easedT);
            if (backgroundImage != null)
            {
                backgroundImage.rectTransform.localScale = Vector3.Lerp(startBgScale, targetBgScale, easedT);
                backgroundImage.color = Color.Lerp(startBgColor, targetBgColor, easedT);
            }
            
            elapsed += Time.deltaTime;
            yield return null;
        }
        
        elapsed = 0;
        Vector3 peakScale = transform.localScale;
        Vector3 peakInnerScale = innerSprite != null ? innerSprite.rectTransform.localScale : Vector3.one;
        Vector3 peakBgScale = backgroundImage != null ? backgroundImage.rectTransform.localScale : Vector3.one;
        List<Vector2> peakStickPositions = new List<Vector2>();
        foreach (var stick in sticks)
        {
            if (stick != null) peakStickPositions.Add(stick.anchoredPosition);
        }
        
        while (elapsed < clickDuration * 0.5f)
        {
            float t = elapsed / (clickDuration * 0.5f);
            float easedT = Mathf.SmoothStep(0, 1, t);
            
            transform.localScale = Vector3.Lerp(peakScale, originalScale, easedT);
            transform.localRotation = Quaternion.Slerp(transform.localRotation, Quaternion.identity, easedT);
            
            if (innerSprite != null) 
                innerSprite.rectTransform.localScale = Vector3.Lerp(peakInnerScale, originalInnerScale, easedT);
            
            if (backgroundImage != null)
            {
                backgroundImage.rectTransform.localScale = Vector3.Lerp(peakBgScale, originalBgScale, easedT);
                backgroundImage.color = Color.Lerp(backgroundImage.color, originalBgColor, easedT);
            }
            
            for (int i = 0; i < sticks.Count; i++)
            {
                if (sticks[i] != null && i < peakStickPositions.Count && i < originalStickPositions.Count)
                {
                    sticks[i].anchoredPosition = Vector2.Lerp(peakStickPositions[i], originalStickPositions[i], easedT);
                    if (i < originalStickScales.Count)
                        sticks[i].localScale = Vector3.Lerp(originalStickScales[i] * 0.85f, originalStickScales[i], easedT);
                }
            }
            
            elapsed += Time.deltaTime;
            yield return null;
        }
        
        ResetAllToOriginal();
    }
}