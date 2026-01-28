import React from 'react';

export const GridBackground: React.FC = () => {
    return (
        <div
            className="absolute inset-0 z-0 w-full h-full pointer-events-none"
            style={{
                backgroundColor: '#f8fafc',
                backgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }}
        />
    );
};
