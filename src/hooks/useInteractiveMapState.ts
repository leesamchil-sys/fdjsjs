import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LOCATION_COORDINATES, mapKeyToLocationId } from '../components/InteractiveMap';
import { Category } from '../types';

export function useInteractiveMapState(activeCategory: Category) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [initialMapId, setInitialMapId] = useState<string>('town');
  const [initialLocationKey, setInitialLocationKey] = useState<string>('');
  const wasOpenedViaUrlRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  const [highlightedLocation, setHighlightedLocation] = useState('');
  const [highlightedItemName, setHighlightedItemName] = useState('');
  const [listHighlightedItemName, setListHighlightedItemName] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const pathname = location.pathname;
    const params = new URLSearchParams(location.search);
    
    let targetMapId: string | null = null;
    let shouldOpenMap = false;

    let decodedPath = pathname.toLowerCase().trim();
    try {
      decodedPath = decodeURIComponent(pathname).toLowerCase().trim();
    } catch {
      // ignore
    }

    if (decodedPath === '/map' || decodedPath === '/map/') {
      shouldOpenMap = true;
      targetMapId = 'town';
    } else if (decodedPath.startsWith('/map/')) {
      shouldOpenMap = true;
      const segment = decodedPath.substring(5).trim();
      if (segment === 'town' || segment === 'whalecanyon' || segment === 'whaleCanyon'.toLowerCase() || segment === '고래섬' || segment === '고래낙하협곡') {
        targetMapId = (segment === 'town' || segment === '고래섬') ? 'town' : 'whaleCanyon';
      }
    } else if (decodedPath.startsWith('/map=')) {
      shouldOpenMap = true;
      const segment = decodedPath.substring(5).trim();
      if (segment === 'town' || segment === 'whalecanyon' || segment === 'whaleCanyon'.toLowerCase() || segment === '고래섬' || segment === '고래낙하협곡') {
        targetMapId = (segment === 'town' || segment === '고래섬') ? 'town' : 'whaleCanyon';
      }
    }

    const queryKeys = Array.from(params.keys());
    for (const key of queryKeys) {
      const val = params.get(key)?.toLowerCase().trim();
      if (val) {
        const k = key.toLowerCase();
        if (k === 'map' || k === 'id' || k === 'mapid') {
          if (val === 'town' || val === 'whalecanyon' || val === 'whaleCanyon'.toLowerCase() || val === '고래섬' || val === '고래낙하협곡') {
            targetMapId = (val === 'town' || val === '고래섬') ? 'town' : 'whaleCanyon';
            shouldOpenMap = true;
          }
        }
      }
    }

    if (shouldOpenMap) {
      const finalMapId = targetMapId || 'town';
      const locParam = params.get('location') || '';
      
      const currentUrl = location.pathname + location.search;
      const lastClosedUrl = sessionStorage.getItem('last_closed_map_url');
      
      let isReload = false;
      if (typeof window !== 'undefined' && window.performance) {
        const navEntries = window.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navEntries.length > 0 && navEntries[0].type === 'reload') {
          isReload = true;
        } else if (window.performance.navigation && window.performance.navigation.type === 1) {
          isReload = true;
        }
      }
      
      if (isInitialLoadRef.current && lastClosedUrl === currentUrl && isReload) {
        setIsMapOpen(false);
        setInitialMapId('town');
        setInitialLocationKey('');
        isInitialLoadRef.current = false;
        
        const newPathname = '/' + activeCategory;
        const newParams = new URLSearchParams(location.search);
        newParams.delete('map');
        newParams.delete('id');
        newParams.delete('mapid');
        newParams.delete('location');
        const cleanSearch = newParams.toString();
        const newUrl = newPathname + (cleanSearch ? '?' + cleanSearch : '') + location.hash;
        navigate(newUrl, { replace: true });
        return;
      }
      
      isInitialLoadRef.current = false;
      wasOpenedViaUrlRef.current = true;
      setInitialMapId(finalMapId);
      setInitialLocationKey(locParam);
      setIsMapOpen(true);
    } else {
      isInitialLoadRef.current = false;
      setIsMapOpen(false);
      setInitialMapId('town');
      setInitialLocationKey('');
    }
  }, [location, navigate, activeCategory]);

  const handleLocationClick = (locationName: string, itemName: string) => {
    setHighlightedLocation(locationName);
    setHighlightedItemName(itemName);
    setListHighlightedItemName('');

    const matched = Object.values(LOCATION_COORDINATES).find(
      loc => loc.name === locationName || loc.displayName === locationName
    );
    const currentPath = location.pathname.startsWith('/map') ? '/home' : location.pathname;
    const searchParams = new URLSearchParams(location.search);

    if (matched) {
      const matchedKey = Object.keys(LOCATION_COORDINATES).find(
        key => LOCATION_COORDINATES[key] === matched
      );
      if (matchedKey) {
        const locationId = mapKeyToLocationId(matchedKey);
        const mapId = matched.mapId || 'town';
        const urlMapId = mapId === 'town' ? '고래섬' : '고래낙하협곡';
        searchParams.set('map', urlMapId);
        searchParams.set('location', locationId);
        navigate(`${currentPath}?${searchParams.toString()}${location.hash}`, { replace: false });
        return;
      }
    }
    
    searchParams.set('map', '고래섬');
    navigate(`${currentPath}?${searchParams.toString()}${location.hash}`, { replace: false });
  };

  return {
    isMapOpen,
    setIsMapOpen,
    isIngredientModalOpen,
    setIsIngredientModalOpen,
    initialMapId,
    initialLocationKey,
    highlightedLocation,
    highlightedItemName,
    listHighlightedItemName,
    setListHighlightedItemName,
    handleLocationClick,
  };
}
