import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MetricItem {
  icon: string;
  label: string;
  value: string;
  color: string;
}

export function MetricRow({ items }: { items: MetricItem[] }) {
  return (
    <View style={s.row}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <View style={s.divider} />}
          <View style={s.item}>
            <Ionicons name={item.icon as never} size={14} color={item.color} />
            <Text style={[s.val, { color: item.color }]}>{item.value}</Text>
            <Text style={s.lbl}>{item.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(84,84,88,0.65)',
    overflow: 'hidden',
  },
  item: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
  divider: { width: 1, backgroundColor: 'rgba(84,84,88,0.65)', marginVertical: 12 },
  val: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  lbl: { color: 'rgba(235,235,245,0.5)', fontSize: 11, fontWeight: '600' },
});
