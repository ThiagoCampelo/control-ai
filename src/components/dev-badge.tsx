'use client';

import { useEffect, useState } from 'react';

export function DevBadge() {
    const [isDev, setIsDev] = useState(false);

    useEffect(() => {
        // Verifica se estamos em localhost ou em uma URL de dev/preview (ex: control-ai-dev.vercel.app)
        const hostname = window.location.hostname;
        const devHost = hostname.includes('localhost') || hostname.includes('-dev') || hostname.includes('preview');
        if (devHost) {
            setIsDev(true);
        }
    }, []);

    if (!isDev) return null;

    return (
        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse ml-2">
            DEV
        </span>
    );
}
