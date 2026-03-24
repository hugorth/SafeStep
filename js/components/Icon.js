// Icon Component - Robust approach using refs to prevent React/Lucide conflicts
const Icon = ({ name, size = 24, color = "currentColor", className = "", ...props }) => {
    const iconRef = React.useRef(null);
    const [iconSvg, setIconSvg] = React.useState(null);

    React.useEffect(() => {
        if (window.lucide && window.lucide.icons && window.lucide.icons[name]) {
            try {
                const iconData = window.lucide.icons[name];
                const svg = `<svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="${size}" 
                    height="${size}" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="${color}" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                    class="${className}"
                >${iconData.toSvg ? iconData.toSvg() : iconData}</svg>`;
                setIconSvg(svg);
            } catch (error) {
                console.warn(`Icon "${name}" not found or error rendering:`, error);
            }
        }
    }, [name, size, color, className]);

    // Render using dangerouslySetInnerHTML to avoid React trying to manage the SVG
    return React.createElement('span', {
        ref: iconRef,
        className: `inline-flex ${className}`,
        dangerouslySetInnerHTML: iconSvg ? { __html: iconSvg } : undefined,
        ...props
    });
};

// No global initialization needed anymore!
const initLucideIcons = () => {
    console.log('✅ Lucide icons are now initialized per-component (no global init needed)');
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Icon, initLucideIcons };
}
