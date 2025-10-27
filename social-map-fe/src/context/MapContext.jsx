import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const MapContext = createContext({
    map: null,
    setMap: () => undefined,
    flyTo: () => undefined,
});

export function MapProvider({ children }) {
    const [map, setMap] = useState(null);

    const flyTo = useCallback(({ lng, lat, zoom = 15, duration = 1500 }) => {
        if (!map) {
            return;
        }

        map.flyTo({
            center: [lng, lat],
            zoom,
            duration,
        });
    }, [map]);

    const value = useMemo(() => ({
        map,
        setMap,
        flyTo,
    }), [map, flyTo]);

    return (
        <MapContext.Provider value={value}>
            {children}
        </MapContext.Provider>
    );
}

export function useMapContext() {
    return useContext(MapContext);
}
