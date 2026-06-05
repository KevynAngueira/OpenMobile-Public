// DevPanel.tsx
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';

// Import Configs
import { canUseDevFlags } from '../configs/DevFlagsConfig';

// Import Sections
import DevExtractorSection from '../components/DevExtractorSection';
import DevFlagsSection from '../components/DevFlagsSection';
import DevOptionsSection from '../components/DevModesSection';
import DevServerSection from '../components/DevServerSection';
import DevResetSection from '../components/DevResetSection';
import DevVisualizeSection from '../components/DevVisualizeSection';
import DevCollectorSection from '../components/DevCollectorSection';

export default function DevPanel() {
  if (!canUseDevFlags) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Developer Panel</Text>

      <DevServerSection/>
      <DevVisualizeSection/>
      <DevResetSection/>
      <DevOptionsSection/>
      <DevFlagsSection/>
      <DevExtractorSection/>
      <DevCollectorSection/>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
});
