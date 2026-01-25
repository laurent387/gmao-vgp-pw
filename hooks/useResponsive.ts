import { useWindowDimensions, Platform } from 'react-native';
import { useMemo } from 'react';

export function useIsDesktop() {
  const { width } = useWindowDimensions();
  
  return useMemo(() => {
    // Web desktop = width > 1024px OR explicitly check if web platform
    // Native mobile = always mobile
    if (Platform.OS === 'web') {
      return width >= 1024;
    }
    return false;
  }, [width]);
}

export function useScreenSize() {
  const { width, height } = useWindowDimensions();
  
  return useMemo(() => ({
    width,
    height,
    isSmall: width < 480,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isLandscape: width > height,
  }), [width, height]);
}
