import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, Modal } from 'react-native';
import { CameraView } from 'expo-camera';
import Colors from '../constants/Colors';
import { X } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

interface BarcodeScannerProps {
  visible: boolean;
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ visible, onScan, onClose }: BarcodeScannerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) setScanned(false);
  }, [visible]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScan(data);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          facing="back"
        />

        <View style={styles.overlay}>
          <View style={styles.viewfinder} />
          <Text style={styles.hint}>
            {scanned ? 'Código escaneado' : 'Apunta al código de barras del producto'}
          </Text>
        </View>

        <Pressable onPress={onClose} style={styles.closeBtn}>
          <X size={24} color={colors.text} />
        </Pressable>

        {scanned && (
          <Pressable style={styles.rescanBtn} onPress={() => setScanned(false)}>
            <Text style={styles.rescanText}>Escanear de nuevo</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

function createStyles(colors: typeof Colors.dark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    viewfinder: {
      width: 250,
      height: 250,
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: 16,
      backgroundColor: 'transparent',
    },
    hint: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      marginTop: 20,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
    closeBtn: {
      position: 'absolute',
      top: 50,
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    rescanBtn: {
      position: 'absolute',
      bottom: 80,
      alignSelf: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
    },
    rescanText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
}
