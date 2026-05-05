/**
 * V4.5 Faz 2 — Karakterler listesi `(tabs)/sessions`'a taşındı.
 * Eski URL'lere bağlı olabilecek deep link'ler için redirect.
 */

import { Redirect } from 'expo-router';

export default function CharactersIndexRedirect() {
  return <Redirect href="/(tabs)/sessions" />;
}
