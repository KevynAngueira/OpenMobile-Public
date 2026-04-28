import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { CollectorIdentityService } from "../services/CollectorIdentityService";

export default function DevCollectorSection() {
  const [currentCollector, setCurrentCollector] = useState("");
  const [newCollectorName, setNewCollectorName] = useState("");

  async function loadCollector() {
    const identity = await CollectorIdentityService.getIdentity();
    setCurrentCollector(identity.collectorName);
  }

  useEffect(() => {
    loadCollector();
  }, []);

  async function transferDevice() {
    const trimmedName = newCollectorName.trim();

    if (!trimmedName) {
      Alert.alert(
        "Missing Name",
        "Please enter the name of the new collector."
      );
      return;
    }

    if (trimmedName === currentCollector) {
      Alert.alert(
        "Same Collector",
        "The new collector name matches the current collector."
      );
      return;
    }

    Alert.alert(
      "Transfer Device Ownership",
      [
        `Current Collector: ${currentCollector}`,
        "",
        "Transferring this device creates a new collector ID and cannot be undone.",
        "",
        `Only continue if this device is being permanently reassigned to ${trimmedName}.`
      ].join("\n"),
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Transfer",
          style: "destructive",
          onPress: async () => {
            await CollectorIdentityService.transferDevice(
              trimmedName
            );
    
            setNewCollectorName("");
            await loadCollector();
    
            Alert.alert(
              "Transfer Complete",
              `This device is now assigned to ${trimmedName}.`
            );
          },
        },
      ]
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Collector Configuration
      </Text>

      <View style={styles.infoBox}>
        <Text style={styles.currentLabel}>
          Current Collector
        </Text>
        <Text style={styles.currentCollector}>
          {currentCollector || "Loading..."}
        </Text>
      </View>

      <Text style={styles.warningText}>
        Warning: This action cannot be undone.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="New collector name"
        value={newCollectorName}
        onChangeText={setNewCollectorName}
      />

      <TouchableOpacity
        style={styles.transferButton}
        onPress={transferDevice}
      >
        <Text style={styles.whiteText}>
          Transfer Device
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
  },

  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 16,
  },

  infoBox: {
    backgroundColor: "#e8edf5",
    borderWidth: 1,
    borderColor: "#9aa8bd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  
  currentLabel: {
    fontSize: 12,
    color: "#4a5568",
    fontWeight: "600",
    marginBottom: 4,
  },
  
  currentCollector: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a202c",
  },

  warningText: {
    color: "#b26a00",
    marginBottom: 12,
    lineHeight: 20,
  },

  input: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    borderRadius: 6,
  },

  transferButton: {
    backgroundColor: "#d9534f",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },

  whiteText: {
    color: "white",
    fontWeight: "bold",
  },
});