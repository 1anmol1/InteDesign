import React from 'react';
import brandkritLogo from '../assets/brandkrit.svg';

/**
 * BrandkritAttribution Component
 * 
 * Displays "Developed by Brandkrit" with the SVG logo using an img tag for accurate rendering.
 * Applies a CSS filter to make the logo white (since original is black).
 */
const BrandkritAttribution = ({ width = "90", style = {} }) => {
    return (
        <a
            href="https://brandkrit.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Developed by Brandkrit"
            className="group flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-white/50 hover:text-white transition-colors duration-300"
            style={style}
        >
            <span>Developed by</span>
            <img
                src={brandkritLogo}
                alt="Brandkrit Logo"
                width={width}
                height="auto"
                className="opacity-50 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    filter: 'brightness(0) invert(1)',
                    display: 'block'
                }}
            />
        </a>
    );
};

export default BrandkritAttribution;
