import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';
import { CameraView, useCameraPermissions } from 'expo-camera';

type ScanState = 'idle' | 'scanning' | 'success' | 'error';

export default function ScanQRScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    } else {
      setScanState('scanning');
    }
  }, [permission]);

  const handleBarCodeScanned = useCallback(({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScanState('success');

    // Parse OrbitPay QR format: orbitpay://send?to=@username&amount=50&note=lunch
    try {
      const url = new URL(data);
      if (url.protocol === 'orbitpay:') {
        const params = url.searchParams;
        const to = params.get('to') ?? '';
        const amount = params.get('amount') ?? '';
        const note = params.get('note') ?? '';

        showAlert(
          'OrbitPay QR Detected',
          `Send ${amount ? `$${amount}` : 'money'} to ${to}${note ? ` · "${note}"` : ''}`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => { setScanned(false); setScanState('scanning'); } },
            {
              text: 'Continue',
              style: 'default',
              onPress: () => {
                router.replace({
                  pathname: '/send-money',
                  params: { prefillRecipient: to, prefillAmount: amount, prefillNote: note },
                });
              },
            },
          ]
        );
      } else {
        // Generic QR — show raw data
        showAlert('QR Code Scanned', `Content: ${data.slice(0, 80)}${data.length > 80 ? '...' : ''}`, [
          { text: 'OK', style: 'default', onPress: () => { setScanned(false); setScanState('scanning'); } },
        ]);
      }
    } catch {
      // Not a URL — treat as OrbitID or plain text
      const isOrbitId = data.startsWith('@') || /^[A-Za-z0-9._-]{3,30}$/.test(data);
      if (isOrbitId) {
        showAlert('User Found', `Send money to ${data}?`, [
          { text: 'Cancel', style: 'cancel', onPress: () => { setScanned(false); setScanState('scanning'); } },
          {
            text: 'Send Money',
            style: 'default',
            onPress: () => router.replace({ pathname: '/send-money', params: { prefillRecipient: data } }),
          },
        ]);
      } else {
        showAlert('QR Scanned', data.slice(0, 100), [
          { text: 'OK', style: 'default', onPress: () => { setScanned(false); setScanState('scanning'); } },
        ]);
      }
    }
  }, [scanned, router, showAlert]);

  if (!permission) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.permissionContent}>
          <View style={styles.permissionIcon}>
            <MaterialIcons name="qr-code-scanner" size={52} color={Colors.primary} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionText}>
            OrbitPay needs camera access to scan QR codes for payments and recipient lookup.
          </Text>
          <Pressable style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Camera Permission</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Dark overlay with cutout effect */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
          <Pressable style={styles.overlayBtn} onPress={() => router.back()} hitSlop={12}>
            <MaterialIcons name="close" size={22} color={Colors.textOnDark} />
          </Pressable>
          <Text style={styles.overlayTitle}>Scan QR Code</Text>
          <Pressable style={styles.overlayBtn} onPress={() => setTorchOn(v => !v)} hitSlop={12}>
            <MaterialIcons name={torchOn ? 'flash-on' : 'flash-off'} size={22} color={torchOn ? '#FCD34D' : Colors.textOnDark} />
          </Pressable>
        </View>

        {/* Scan frame */}
        <View style={styles.scanArea}>
          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Scan line animation hint */}
          {scanState === 'scanning' && (
            <View style={styles.scanLineContainer}>
              <View style={styles.scanLine} />
            </View>
          )}

          {/* Success overlay */}
          {scanState === 'success' && (
            <View style={styles.successOverlay}>
              <MaterialIcons name="check-circle" size={64} color={Colors.success} />
            </View>
          )}
        </View>

        {/* Bottom instructions */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <Text style={styles.scanInstruction}>
            {scanState === 'scanning'
              ? 'Point at an OrbitPay QR code or any payment QR'
              : 'Processing QR code…'}
          </Text>

          {/* Manual OrbitID entry */}
          <Pressable
            style={styles.manualEntry}
            onPress={() => router.replace('/send-money')}
          >
            <MaterialIcons name="edit" size={16} color={Colors.primary} />
            <Text style={styles.manualEntryText}>Enter OrbitID manually</Text>
          </Pressable>

          {/* Gallery QR */}
          <Pressable
            style={styles.galleryBtn}
            onPress={() => showAlert('Gallery QR', 'Select a QR code image from your photo library.')}
          >
            <MaterialIcons name="photo-library" size={16} color={Colors.textOnDark} />
            <Text style={styles.galleryBtnText}>Choose from Gallery</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const FRAME_SIZE = 260;
const CORNER_SIZE = 28;
const CORNER_THICKNESS = 4;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  closeBtn: { position: 'absolute', top: 60, left: 20, zIndex: 10 },
  permissionContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  permissionIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, ...Shadow.md,
  },
  permissionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  permissionText: { fontSize: FontSize.base, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  permissionBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxxl, ...Shadow.md,
  },
  permissionBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textOnDark },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBar: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: Spacing.base,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingBottom: Spacing.sm,
  },
  overlayBtn: {
    width: 40, height: 40, borderRadius: Radius.circle,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  overlayTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textOnDark },
  scanArea: {
    width: FRAME_SIZE, height: FRAME_SIZE,
    position: 'relative', alignItems: 'center', justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: Colors.mint,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 4 },
  scanLineContainer: { position: 'absolute', left: 4, right: 4, top: 4, bottom: 4, overflow: 'hidden' },
  scanLine: { height: 2, backgroundColor: Colors.mint, opacity: 0.8, marginTop: '50%' },
  successOverlay: { alignItems: 'center', justifyContent: 'center' },
  bottomBar: {
    width: '100%', alignItems: 'center', paddingHorizontal: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingTop: Spacing.xl,
  },
  scanInstruction: { fontSize: FontSize.base, color: Colors.textOnDark, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
  manualEntry: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg, paddingVertical: 12, marginBottom: Spacing.sm,
  },
  manualEntryText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  galleryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
  },
  galleryBtnText: { fontSize: FontSize.sm, color: Colors.textOnDark, fontWeight: FontWeight.medium },
});
