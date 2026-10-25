const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, query, where, increment } = require('firebase/firestore');
let pass = 0, fail = 0;
async function t(name, p, expectOk) {
  try { await (expectOk ? assertSucceeds(p) : assertFails(p)); pass++; console.log('ok  ', name); }
  catch (e) { fail++; console.log('FAIL', name, '—', String(e.message).split('\n')[0].slice(0, 120)); }
}
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'demo-mf', firestore: { rules: fs.readFileSync(__dirname + '/../../firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
  const anon = env.unauthenticatedContext().firestore();
  const alice = env.authenticatedContext('alice', { email: 'alice@x.ru', email_verified: true }).firestore();
  const bob = env.authenticatedContext('bob', { email: 'bob@x.ru', email_verified: true }).firestore();
  const carl = env.authenticatedContext('carl', { email: 'carl@x.ru', email_verified: true }).firestore(); // забанен
  const adm = env.authenticatedContext('adm', { email: 'adm@x.ru', email_verified: true }).firestore();   // админ через admins/adm
  const owner = env.authenticatedContext('own', { email: 'mathframe.ru@gmail.com', email_verified: true }).firestore();
  const fakeOwner = env.authenticatedContext('fake', { email: 'mathframe.ru@gmail.com', email_verified: false }).firestore();

  await env.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await setDoc(doc(d, 'admins/adm'), { granted: true });
    await setDoc(doc(d, 'bannedUsers/carl'), { reason: 'x' });
    await setDoc(doc(d, 'forumArticles/a1'), { title: 'T', bodyHTML: '<p>x</p>', authorUid: 'alice', views: 5, tags: [] });
    await setDoc(doc(d, 'forumArticles/a1/replies/r1'), { bodyHTML: '<p>r</p>', authorUid: 'bob', likes: 0, dislikes: 0, voters: {}, deleted: false });
    await setDoc(doc(d, 'forumArticles/a1/replies/r6'), { bodyHTML: '<p>r</p>', authorUid: 'bob', likes: 0, dislikes: 0, voters: {}, deleted: false });
    await setDoc(doc(d, 'forumDrafts/d1'), { authorUid: 'alice' });
    await setDoc(doc(d, 'settings/site'), { banner: 'hi', maintenance: false });
    await setDoc(doc(d, 'boards/b1234567890123456'), { owner: 'alice', mode: 'edit', bg: 'cells', name: 'B', updatedAt: 1 });
    await setDoc(doc(d, 'boards/v1234567890123456'), { owner: 'alice', mode: 'view', bg: 'cells', name: 'V', updatedAt: 1 });
  });

  // форум: статьи
  await t('все читают статьи', getDoc(doc(anon, 'forumArticles/a1')), true);
  await t('клиент не создаёт статью (обход модерации)', setDoc(doc(bob, 'forumArticles/new'), { title: 'T', authorUid: 'bob', bodyHTML: 'x' }), false);
  await t('клиент не создаёт статью через add', addDoc(collection(bob, 'forumArticles'), { title: 'T', authorUid: 'bob' }), false);
  await t('+1 к просмотрам (аноним)', updateDoc(doc(anon, 'forumArticles/a1'), { views: increment(1) }), true);
  await t('+10 к просмотрам запрещено', updateDoc(doc(bob, 'forumArticles/a1'), { views: 15 }), false);
  await t('автор выбирает лучший ответ', updateDoc(doc(alice, 'forumArticles/a1'), { bestId: 'r1' }), true);
  await t('не автор не выбирает лучший ответ', updateDoc(doc(bob, 'forumArticles/a1'), { bestId: 'r1' }), false);
  await t('автор не правит текст статьи в обход сервера', updateDoc(doc(alice, 'forumArticles/a1'), { bodyHTML: '<p>hack</p>' }), false);
  await t('автор не закрепляет статью', updateDoc(doc(alice, 'forumArticles/a1'), { pinned: true }), false);
  await t('админ закрепляет статью', updateDoc(doc(adm, 'forumArticles/a1'), { pinned: true }), true);
  await t('чужой не удаляет статью', deleteDoc(doc(bob, 'forumArticles/a1')), false);
  // ответы
  await t('ответ: вошедший создаёт от своего имени', setDoc(doc(bob, 'forumArticles/a1/replies/r2'), { bodyHTML: '<p>hi</p>', authorUid: 'bob', likes: 0, dislikes: 0, voters: {}, deleted: false }), true);
  await t('ответ от чужого имени запрещён', setDoc(doc(bob, 'forumArticles/a1/replies/r3'), { bodyHTML: '<p>hi</p>', authorUid: 'alice' }), false);
  await t('забаненный не отвечает', setDoc(doc(carl, 'forumArticles/a1/replies/r4'), { bodyHTML: '<p>hi</p>', authorUid: 'carl' }), false);
  await t('аноним не отвечает', setDoc(doc(anon, 'forumArticles/a1/replies/r5'), { bodyHTML: 'x', authorUid: 'x' }), false);
  await t('голос за ответ', updateDoc(doc(alice, 'forumArticles/a1/replies/r1'), { voters: { alice: 'like' }, likes: 1, dislikes: 0 }), true);
  await t('нельзя менять текст ответа при голосовании', updateDoc(doc(alice, 'forumArticles/a1/replies/r1'), { bodyHTML: 'x', likes: 1 }), false);
  await t('автор ответа удаляет (deleted)', updateDoc(doc(bob, 'forumArticles/a1/replies/r1'), { deleted: true, bodyHTML: '' }), true);
  await t('автор статьи убирает чужой ответ', updateDoc(doc(alice, 'forumArticles/a1/replies/r2'), { deleted: true, bodyHTML: '' }), true);
  await t('посторонний не убирает чужой ответ', updateDoc(doc(carl, 'forumArticles/a1/replies/r6'), { deleted: true, bodyHTML: '' }), false);
  await t('автор статьи удаляет её ответы (каскад)', deleteDoc(doc(alice, 'forumArticles/a1/replies/r2')), true);
  // черновики и лимиты — только сервер
  await t('forumDrafts закрыта для чтения', getDoc(doc(alice, 'forumDrafts/d1')), false);
  await t('forumDrafts закрыта для записи', setDoc(doc(alice, 'forumDrafts/d2'), { a: 1 }), false);
  await t('forumDrafts закрыта и для админа', getDoc(doc(adm, 'forumDrafts/d1')), false);
  await t('rateLimits закрыта', setDoc(doc(alice, 'rateLimits/x'), { t: [] }), false);
  // права и профили
  await t('пользователь не выдаёт себе админа', setDoc(doc(bob, 'admins/bob'), { granted: true }), false);
  await t('владелец (подтверждённая почта) выдаёт админа', setDoc(doc(owner, 'admins/dave'), { granted: true }), true);
  await t('неподтверждённая почта владельца не проходит', setDoc(doc(fakeOwner, 'admins/fake'), { granted: true }), false);
  await t('админ не банит (только владелец)', setDoc(doc(adm, 'bannedUsers/x'), { a: 1 }), false);
  await t('владелец банит', setDoc(doc(owner, 'bannedUsers/x'), { a: 1 }), true);
  await t('свой профиль пишется', setDoc(doc(bob, 'users/bob'), { email: 'b' }), true);
  await t('чужой профиль не пишется', setDoc(doc(bob, 'users/alice'), { email: 'b' }), false);
  await t('чужой профиль не читается', getDoc(doc(bob, 'users/alice')), false);
  await t('админ читает профили', getDoc(doc(adm, 'users/alice')), true);
  await t('своя запись admins читается (проверка роли)', getDoc(doc(adm, 'admins/adm')), true);
  // настройки
  await t('настройки читают все', getDoc(doc(anon, 'settings/site')), true);
  await t('пользователь не пишет настройки', setDoc(doc(bob, 'settings/site'), { banner: 'x' }), false);
  await t('админ меняет баннер', updateDoc(doc(adm, 'settings/site'), { banner: 'new' }), true);
  await t('админ не включает техработы', updateDoc(doc(adm, 'settings/site'), { maintenance: true }), false);
  await t('владелец включает техработы', updateDoc(doc(owner, 'settings/site'), { maintenance: true }), true);
  await t('счётчик посещений: аноним пишет', setDoc(doc(anon, 'stats/visits'), { total: increment(1) }, { merge: true }), true);
  await t('счётчик читает только админ', getDoc(doc(bob, 'stats/visits')), false);
  // доски
  const B = 'b1234567890123456', V = 'v1234567890123456';
  await t('доска: аноним не читает', getDoc(doc(anon, 'boards/' + B)), false);
  await t('доска: вошедший читает по ссылке', getDoc(doc(bob, 'boards/' + B)), true);
  await t('доска: список только своих', getDocs(query(collection(bob, 'boards'), where('owner', '==', 'bob'))), true);
  await t('доска: чужой список запрещён', getDocs(query(collection(bob, 'boards'), where('owner', '==', 'alice'))), false);
  await t('доска: создание владельцем', setDoc(doc(bob, 'boards/n1234567890123456'), { bg: 'cells', name: 'N', createdAt: 1, updatedAt: 1, owner: 'bob' }), true);
  await t('доска: создание с чужим owner запрещено', setDoc(doc(bob, 'boards/m1234567890123456'), { bg: 'cells', name: 'N', createdAt: 1, updatedAt: 1, owner: 'alice' }), false);
  await t('доска: участник меняет фон', updateDoc(doc(bob, 'boards/' + B), { bg: 'grid', updatedAt: 2 }), true);
  await t('доска: участник не меняет имя', updateDoc(doc(bob, 'boards/' + B), { name: 'hack' }), false);
  await t('доска: участник не включает «только просмотр»', updateDoc(doc(bob, 'boards/' + B), { mode: 'view' }), false);
  await t('доска: владелец включает режим просмотра', updateDoc(doc(alice, 'boards/' + B), { mode: 'view', updatedAt: 3 }), true);
  await t('доска «только просмотр»: участник не меняет фон', updateDoc(doc(bob, 'boards/' + V), { bg: 'grid', updatedAt: 2 }), false);
  await t('доска: участник рисует (режим edit)', setDoc(doc(carl, 'boards/n1234567890123456/items/i9'), { x: 1 }), true);
  await t('доска: владелец рисует на своей', setDoc(doc(bob, 'boards/n1234567890123456/items/i1'), { x: 1 }), true);
  await t('доска «только просмотр»: участник не рисует', setDoc(doc(bob, 'boards/' + V + '/items/i1'), { x: 1 }), false);
  await t('доска «только просмотр»: владелец рисует', setDoc(doc(alice, 'boards/' + V + '/items/i1'), { x: 1 }), true);
  await t('доска: чужой не удаляет', deleteDoc(doc(bob, 'boards/' + V)), false);
  await t('доска: владелец удаляет', deleteDoc(doc(alice, 'boards/' + V)), true);
  // чаты ИИ
  await t('ИИ-чат: свой пишется', setDoc(doc(bob, 'aiChats/bob/chats/c1'), { a: 1 }), true);
  await t('ИИ-чат: чужой не читается', getDoc(doc(alice, 'aiChats/bob/chats/c1')), false);
  await t('ИИ-чат: админ читает (статистика)', getDoc(doc(adm, 'aiChats/bob/chats/c1')), true);
  await t('aiSync: свой', setDoc(doc(bob, 'aiSync/bob'), { a: 1 }), true);
  await t('aiSync: чужой запрещён', setDoc(doc(bob, 'aiSync/alice'), { a: 1 }), false);

  console.log(`\nПройдено: ${pass}, провалено: ${fail}`);
  await env.cleanup(); process.exit(fail ? 1 : 0);
})();
