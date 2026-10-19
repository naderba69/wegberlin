/**
 * Proper names that occur in reading texts and long inputs (ADR-126, P2-401).
 * Personal names, town, district, street and square names, and the names of businesses and
 * institutions (Hotel Hafenblick, telc) are not vocabulary to learn, so the
 * lexical-load measurement leaves them out of both the numerator and the denominator and reports
 * how many it removed. Country and language names (Tunesien, Spanien, Deutsch …) are taught
 * vocabulary and are deliberately NOT listed here.
 */
export const CURRICULUM_PROPER_NAMES_POLICY = "curriculum-proper-names-v1" as const;

export const curriculumPersonNames = [
  "Adam", "Adel", "Ali", "Amal", "Amir", "Amira", "Anna", "Aylin", "Aziz", "Ben", "Bensalem", "Berger", "Brandt", "Dalia", "David", "Demir",
  "Elena", "Elias", "Farid", "Goethe", "Hana", "Hatem", "Jana", "Jonas", "Julia", "Karim", "Keller", "Kenji", "Kessler", "Kraus", "Krüger", "Lea", "Leila",
  "Lena", "Lenz", "Lina", "Mara", "Mariam", "Meier", "Mei", "Mila", "Mira", "Mona", "Mouna", "Nabil", "Nadia", "Nora", "Okafor", "Özdemir", "Omar",
  "Paul", "Rami", "Rania", "Salem", "Salma", "Sami", "Samir", "Sara", "Schmidt", "Sofia", "Tarek", "Thomas", "Vogt", "Weber", "Yilmaz", "Yusuf",
] as const;

export const curriculumPlaceNames = [
  "Alexanderplatz", "Berlin", "Dresden", "Hafenblick", "Köln", "Leipzig", "Lindenau", "Lindenstraße", "Monastir", "München", "Potsdam", "Sousse", "telc", "Weimar",
] as const;
