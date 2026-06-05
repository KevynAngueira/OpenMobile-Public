import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { DevModes } from "../configs/DevModesConfig";

export default function DevModesSection() {
  const [modesState, setModesState] = useState(() =>
    DevModes.get()
  );

  const updateMode = <
    K extends keyof ReturnType<typeof DevModes.get>
  >(
    key: K,
    value: ReturnType<typeof DevModes.get>[K]
  ) => {
    DevModes.setMode(key, value);

    setModesState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const modeKeys = DevModes.getKeys();

  if (modeKeys.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
      Configuration Modes
      </Text>

      {modeKeys.map((key) => {
        const possibleValues =
          DevModes.getModeValues(key);

        return (
          <View
            key={key}
            style={styles.modeGroup}
          >
            <Text style={styles.modeLabel}>
              {formatLabel(key)}
            </Text>

            <View style={styles.modeRow}>
            {possibleValues.map((value) => (
                <TouchableOpacity
                key={String(value)}
                style={[
                    styles.modeButton,
                    modesState[key] === value &&
                    styles.modeButtonActive,
                ]}
                onPress={() =>
                    updateMode(key, value)
                }
                >
                <Text style={styles.modeButtonText}>
                    {formatLabel(String(value))}
                </Text>
                </TouchableOpacity>
            ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function formatLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) =>
      str.toUpperCase()
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
    marginBottom: 15,
    fontSize: 16,
  },

  modeGroup: {
    marginBottom: 20,
  },
  
  modeLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  
  modeButton: {
    backgroundColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 60,
  },
  
  modeButtonActive: {
    backgroundColor: "#1E3A5F",
  },
  
  modeButtonText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});