/**
 * Contacts (iOS) — read.
 * Asistan "annenin numarası..." dediğinde kullanır.
 */

import * as Contacts from 'expo-contacts';

export async function requestContactsAuth(): Promise<boolean> {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === 'granted';
}

export async function searchContacts(query: string, limit = 10) {
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
    name: query,
    pageSize: limit,
  });
  return data.map((c) => ({
    id: c.id,
    name: c.name,
    phoneNumbers: (c.phoneNumbers ?? []).map((p) => p.number).filter(Boolean),
    emails: (c.emails ?? []).map((e) => e.email).filter(Boolean),
  }));
}

export async function getContactByName(name: string) {
  const results = await searchContacts(name, 5);
  return results[0] ?? null;
}
