/**
 * Contacts (iOS) — read + sync.
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

export async function getAllContacts() {
  const { status } = await Contacts.getPermissionsAsync();
  if (status !== 'granted') return [];
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
    pageSize: 1000,
  });
  return data
    .filter((c) => c.id && c.name)
    .map((c) => ({
      externalId: c.id!,
      name: c.name!,
      phoneNumbers: (c.phoneNumbers ?? []).map((p) => p.number).filter((n): n is string => !!n),
      emails: (c.emails ?? []).map((e) => e.email).filter((e): e is string => !!e),
    }));
}
