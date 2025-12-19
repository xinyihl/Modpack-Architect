import React from 'react';
import { ModpackProvider } from './context/ModpackContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { I18nProvider } from './context/I18nContext';
import { MainLayout } from './components/MainLayout';

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <ModpackProvider>
          <I18nProvider>
            <MainLayout />
          </I18nProvider>
        </ModpackProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
