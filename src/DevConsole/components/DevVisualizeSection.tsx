// DevVisualizeSection.tsx
import React from 'react';
import { View, Text, Button, StyleSheet, Linking } from 'react-native';
import { DevServerConfig } from '../configs/DevServerConfig';

export default function DevVisualizeSection() {
    const openDashboard = () => {
        const url = `${DevServerConfig.getBaseURL()}/visualize/results`; 
        Linking.openURL(url);
    };

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visualize Results</Text>
            <Button
                title="Open Webpage"
                onPress={openDashboard}
                color="#4CAF50"
            />
        </View>
    );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 16,
  },
});