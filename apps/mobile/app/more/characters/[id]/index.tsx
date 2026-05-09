import { Redirect, useLocalSearchParams } from 'expo-router';

export default function CharacterRoot() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) return null;
  return <Redirect href={`/more/characters/${id}/edit` as any} />;
}
