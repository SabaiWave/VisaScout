'use client';

import { ClerkProvider } from '@clerk/nextjs';

const darkVariables = {
  fontFamily: "'Geist', system-ui, sans-serif",
  colorPrimary: '#6366F1',
  colorTextOnPrimaryBackground: '#ffffff',
  borderRadius: '0.5rem',
  colorBackground: '#111118',
  colorInputBackground: '#1C1C27',
  colorInputText: '#F4F4F5',
  colorText: '#F4F4F5',
  colorTextSecondary: '#A1A1AA',
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

export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: darkVariables,
        elements: darkElements,
      }}
    >
      {children}
    </ClerkProvider>
  );
}
