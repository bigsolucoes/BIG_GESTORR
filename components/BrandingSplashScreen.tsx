import React from 'react';
import { useAppData } from '../hooks/useAppData';
import { APP_NAME } from '../constants';

interface BrandingSplashScreenProps {
  isFadingOut: boolean;
}

const BrandingSplashScreen: React.FC<BrandingSplashScreenProps> = ({ isFadingOut }) => {
  const { settings, loading: settingsLoading } = useAppData();

  const bgColor = settings.splashScreenBackgroundColor || '#111827'; // Default dark slate if not set

  return (
    <div
      style={{ backgroundColor: bgColor }}
      className={`fixed inset-0 flex flex-col items-center justify-center z-[100] transition-opacity duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Wait for settings to load to prevent flicker between default text and custom logo */}
      {!settingsLoading && (
        <>
          {settings.customLogo ? (
            <img src={settings.customLogo} alt={`${APP_NAME} Logo`} className="h-32 max-h-48 max-w-xs object-contain animate-pulse" />
          ) : (
            // Use text-white for the text logo for high contrast
            <h1 className={`text-9xl font-bold text-white animate-pulse font-robuck tracking-wide`}>{APP_NAME}</h1>
          )}
        </>
      )}
    </div>
  );
};

export default BrandingSplashScreen;
