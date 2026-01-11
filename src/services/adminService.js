import { collection, doc, getDocs, query, where, writeBatch, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export const confirmTeam = async (teamId) => {
  const teamRef = doc(db, `/artifacts/${appId}/public/data/teams`, teamId);
  await updateDoc(teamRef, { status: 'Confirmada' });
};

export const rejectTeam = async (team) => {
  const batch = writeBatch(db);
  const teamRef = doc(db, `/artifacts/${appId}/public/data/teams`, team.id);
  const vagaRef = doc(db, `/artifacts/${appId}/public/data/vagas`, team.vagaId);
  batch.delete(teamRef);
  batch.update(vagaRef, { status: 'Disponível', teamId: '' });
  await batch.commit();
};

export const updateTeam = async (teamId, updates) => {
  const teamRef = doc(db, `/artifacts/${appId}/public/data/teams`, teamId);
  await updateDoc(teamRef, updates);
};

export const deleteTeam = async (team) => {
  const batch = writeBatch(db);
  const teamRef = doc(db, `/artifacts/${appId}/public/data/teams`, team.id);
  const vagaRef = doc(db, `/artifacts/${appId}/public/data/vagas`, team.vagaId);
  batch.delete(teamRef);
  batch.update(vagaRef, { status: 'Disponível', teamId: '' });
  await batch.commit();
};

export const generateWeeklyVagas = async (vagasConfig, currentWeek) => {
  // vagasConfig: objeto { index: { day: N, night: M }, ... }
  const batch = writeBatch(db);
  const basePath = `/artifacts/${appId}/public/data/vagas`;
  for (const [idx, cfg] of Object.entries(vagasConfig)) {
    const day = currentWeek.weekDays[Number(idx)];
    // criar vagas diurnas
    for (let i=0;i<(cfg.day||0);i++){
      const ref = doc(collection(db, basePath));
      batch.set(ref, { id: ref.id, date: day, shiftType: 'day', status: 'Disponível' });
    }
    for (let i=0;i<(cfg.night||0);i++){
      const ref = doc(collection(db, basePath));
      batch.set(ref, { id: ref.id, date: day, shiftType: 'night', status: 'Disponível' });
    }
  }
  await batch.commit();
};

export const createConvoy = async (convoyData) => {
  const ref = doc(collection(db, `/artifacts/${appId}/public/data/convoys`));
  await setDoc(ref, { id: ref.id, ...convoyData });
  return ref.id;
};

export const createTeam = async (teamPayload, vagaId) => {
  const newTeamRef = doc(collection(db, `/artifacts/${appId}/public/data/teams`));
  const vagaRef = doc(db, `/artifacts/${appId}/public/data/vagas`, vagaId);
  const batch = writeBatch(db);
  const teamToSave = { id: newTeamRef.id, ...teamPayload };
  batch.set(newTeamRef, teamToSave);
  batch.update(vagaRef, { status: 'Ocupada', teamId: newTeamRef.id });
  await batch.commit();
  return newTeamRef.id;
};
