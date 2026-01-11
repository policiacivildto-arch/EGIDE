import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';

export const useAdminData = () => {
  const [vagas, setVagas] = useState([]);
  const [teams, setTeams] = useState([]);
  const [convoys, setConvoys] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qVagas = query(collection(db, `/artifacts/${appId}/public/data/vagas`));
    const unsubVagas = onSnapshot(qVagas, snap => setVagas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qTeams = query(collection(db, `/artifacts/${appId}/public/data/teams`));
    const unsubTeams = onSnapshot(qTeams, snap => setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qConvoys = query(collection(db, `/artifacts/${appId}/public/data/convoys`));
    const unsubConvoys = onSnapshot(qConvoys, snap => setConvoys(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qUsers = query(collection(db, `/artifacts/${appId}/users`));
    const unsubUsers = onSnapshot(qUsers, snap => setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qHolidays = query(collection(db, `/artifacts/${appId}/public/data/holidays`));
    const unsubHolidays = onSnapshot(qHolidays, snap => setHolidays(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    setLoading(false);
    return () => {
      unsubVagas(); unsubTeams(); unsubConvoys(); unsubUsers(); unsubHolidays();
    };
  }, []);

  const refresh = useCallback(async () => {
    const [vagasSnap, teamsSnap, convoysSnap, usersSnap, holidaysSnap] = await Promise.all([
      getDocs(query(collection(db, `/artifacts/${appId}/public/data/vagas`))),
      getDocs(query(collection(db, `/artifacts/${appId}/public/data/teams`))),
      getDocs(query(collection(db, `/artifacts/${appId}/public/data/convoys`))),
      getDocs(query(collection(db, `/artifacts/${appId}/users`))),
      getDocs(query(collection(db, `/artifacts/${appId}/public/data/holidays`))),
    ]);

    setVagas(vagasSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setTeams(teamsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setConvoys(convoysSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setAllUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setHolidays(holidaysSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, []);

  return { vagas, teams, convoys, allUsers, holidays, loading, refresh };
};
