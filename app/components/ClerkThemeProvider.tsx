'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { dark } from '@clerk/themes';

const sharedVariables = {
  fontFamily: "'Geist', system-ui, sans-serif",
  colorPrimary: '#6366F1',
  colorTextOnPrimaryBackground: '#ffffff',
  borderRadius: '0.5rem',
};

const darkVariables = {
  ...sharedVariables,
  colorPrimary: '#6366F1',
  colorBackground: '#111118',
  colorInputBackground: '#1C1C27',
  colorInputText: '#F4F4F5',
  colorText: '#F4F4F5',
  colorTextSecondary: '#A1A1AA',
};

const lightVariables = {
  ...sharedVariables,
  colorPrimary: '#4f46e5',
  colorBackground: '#FFFFFF',
  colorInputBackground: '#F3F4F6',
  colorInputText: '#0A0A0A',
  colorText: '#0A0A0A',
  colorTextSecondary: '#4B5563',
};

const darkElements = {
  headerTitle: { color: '#F4F4F5' },
  headerSubtitle: { color: '#A1A1AA' },
  formFieldLabel: { color: '#A1A1AA' },
  formFieldHintText: { color: '#71717A' },
  formFieldInput: { backgroundColor: '#1C1C27', borderColor: '#2D2D3D', color: '#F4F4F5' },
  dividerText: { color: '#71717A' },
  dividerLine: { backgroundColor: '#2D2D3D' },
  socialButtonsBlockButton: { backgroundColor: '#1C1C27', borderColor: '#2D2D3D', color: '#F4F4F5' },
  socialButtonsBlockButtonText: { color: '#F4F4F5' },
  footerActionText: { color: '#D4D4D8' },
  footerActionLink: { color: '#818CF8' },
  footer: { color: '#71717A' },
  identityPreviewText: { color: '#F4F4F5' },
  identityPreviewEditButtonIcon: { color: '#A1A1AA' },
  otpCodeFieldInput: { backgroundColor: '#1C1C27', borderColor: '#2D2D3D', color: '#F4F4F5' },
  userButtonPopoverCard: { backgroundColor: '#111118', borderColor: '#2D2D3D', boxShadow: '0 10px 24px rgba(0,0,0,0.7)' },
  userButtonPopoverMain: { backgroundColor: '#111118' },
  userButtonPopoverActions: { backgroundColor: '#111118' },
  userButtonPopoverActionButton: { color: '#F4F4F5' },
  userButtonPopoverActionButtonText: { color: '#F4F4F5' },
  userButtonPopoverActionButtonIcon: { color: '#A1A1AA' },
  userButtonPopoverCustomItemButton: { color: '#F4F4F5' },
  userButtonPopoverCustomItemButtonText: { color: '#F4F4F5' },
  userButtonPopoverCustomItemButtonIcon: { color: '#A1A1AA' },
  userPreviewMainIdentifier: { color: '#F4F4F5' },
  userPreviewSecondaryIdentifier: { color: '#A1A1AA' },
  userButtonPopoverFooter: { borderColor: '#2D2D3D', backgroundColor: '#111118' },
  card: { backgroundColor: '#111118', borderColor: '#2D2D3D' },
  navbar: { backgroundColor: '#0A0A0A', borderColor: '#2D2D3D' },
  navbarHeader: { color: '#F4F4F5', opacity: 1 },
  navbarButton: { color: '#A1A1AA' },
  navbarButtonIcon: { color: '#A1A1AA' },
  pageScrollBox: { backgroundColor: '#111118' },
  profileSectionTitle: { color: '#F4F4F5', borderColor: '#2D2D3D' },
  profileSectionSubtitle: { color: '#A1A1AA' },
  profileSectionContent: { color: '#F4F4F5' },
  profileSectionPrimaryButton: { color: '#6366F1' },
  profileSectionItem: { borderColor: '#2D2D3D' },
  accordionTriggerButton: { color: '#F4F4F5' },
  badge: { color: '#F4F4F5', backgroundColor: '#1C1C27' },
  badgePrimary: { backgroundColor: '#1C1C27', color: '#A1A1AA' },
  tableHead: { color: '#A1A1AA' },
  paginationButton: { color: '#A1A1AA' },
  paginationButtonIcon: { color: '#A1A1AA' },
  activeDeviceIcon: { color: '#A1A1AA', filter: 'invert(1) brightness(0.6)' },
  activeDevice: { borderColor: '#2D2D3D', color: '#F4F4F5' },
  activeDeviceListItem: { borderColor: '#2D2D3D', color: '#F4F4F5' },
  activeDeviceBrowser: { color: '#A1A1AA' },
  activeDeviceIpAddress: { color: '#A1A1AA' },
  activeDeviceLastActive: { color: '#71717A' },
  pageHeader: { color: '#F4F4F5' },
  pageHeaderTitle: { color: '#F4F4F5' },
  pageHeaderSubtitle: { color: '#A1A1AA' },
  profileSectionTitleText: { color: '#F4F4F5' },
  formattedDate: { color: '#A1A1AA' },
  identityPreviewEditButton: { color: '#6366F1' },
};

const lightElements = {
  headerTitle: { color: '#0A0A0A' },
  headerSubtitle: { color: '#4B5563' },
  formFieldLabel: { color: '#4B5563' },
  formFieldHintText: { color: '#6B7280' },
  formFieldInput: { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB', color: '#0A0A0A' },
  dividerText: { color: '#6B7280' },
  dividerLine: { backgroundColor: '#E5E7EB' },
  socialButtonsBlockButton: { backgroundColor: '#F9F9FB', borderColor: '#D1D5DB', color: '#0A0A0A' },
  socialButtonsBlockButtonText: { color: '#0A0A0A' },
  footerActionText: { color: '#374151' },
  footerActionLink: { color: '#4f46e5' },
  footer: { color: '#6B7280' },
  identityPreviewText: { color: '#0A0A0A' },
  identityPreviewEditButtonIcon: { color: '#4B5563' },
  otpCodeFieldInput: { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB', color: '#0A0A0A' },
  userButtonPopoverCard: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: '0 4px 16px rgba(0,0,0,0.10)' },
  userButtonPopoverMain: { backgroundColor: '#FFFFFF' },
  userButtonPopoverActions: { backgroundColor: '#FFFFFF' },
  userButtonPopoverActionButton: { color: '#0A0A0A' },
  userButtonPopoverActionButtonText: { color: '#0A0A0A' },
  userButtonPopoverActionButtonIcon: { color: '#4B5563' },
  userButtonPopoverCustomItemButton: { color: '#0A0A0A' },
  userButtonPopoverCustomItemButtonText: { color: '#0A0A0A' },
  userButtonPopoverCustomItemButtonIcon: { color: '#4B5563' },
  userPreviewMainIdentifier: { color: '#0A0A0A' },
  userPreviewSecondaryIdentifier: { color: '#4B5563' },
  userButtonPopoverFooter: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  navbar: { backgroundColor: '#F9F9FB', borderColor: '#E5E7EB' },
  navbarHeader: { color: '#0A0A0A', opacity: 1 },
  navbarButton: { color: '#4B5563' },
  navbarButtonIcon: { color: '#4B5563' },
  pageScrollBox: { backgroundColor: '#FFFFFF' },
  profileSectionTitle: { color: '#0A0A0A', borderColor: '#E5E7EB' },
  profileSectionSubtitle: { color: '#4B5563' },
  profileSectionContent: { color: '#0A0A0A' },
  profileSectionPrimaryButton: { color: '#4f46e5' },
  profileSectionItem: { borderColor: '#E5E7EB' },
  accordionTriggerButton: { color: '#0A0A0A' },
  badge: { color: '#0A0A0A', backgroundColor: '#F3F4F6' },
  badgePrimary: { backgroundColor: '#F3F4F6', color: '#4B5563' },
  tableHead: { color: '#4B5563' },
  paginationButton: { color: '#4B5563' },
  paginationButtonIcon: { color: '#4B5563' },
  activeDeviceIcon: { color: '#4B5563' },
  activeDevice: { borderColor: '#E5E7EB', color: '#0A0A0A' },
  activeDeviceListItem: { borderColor: '#E5E7EB', color: '#0A0A0A' },
  activeDeviceBrowser: { color: '#4B5563' },
  activeDeviceIpAddress: { color: '#4B5563' },
  activeDeviceLastActive: { color: '#6B7280' },
  pageHeader: { color: '#0A0A0A' },
  pageHeaderTitle: { color: '#0A0A0A' },
  pageHeaderSubtitle: { color: '#4B5563' },
  profileSectionTitleText: { color: '#0A0A0A' },
  formattedDate: { color: '#4B5563' },
  identityPreviewEditButton: { color: '#4f46e5' },
};

export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  return (
    <ClerkProvider
      appearance={{
        baseTheme: isDark ? dark : undefined,
        variables: isDark ? darkVariables : lightVariables,
        elements: isDark ? darkElements : lightElements,
      }}
    >
      {children}
    </ClerkProvider>
  );
}
