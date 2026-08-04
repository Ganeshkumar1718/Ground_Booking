const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Path to SQLite DB (relative to this script)
const dbPath = path.resolve(__dirname, '..', 'playspot.sqlite');
const db = new sqlite3.Database(dbPath);

// Image pools (filenames present in the uploads folder)
const cricketImages = [
  'a.png','b.png','c.jpg','d.jpg','e.jpg','f.jpg','g.jpg','h.jpg','i.jpg','j.jpg','k.jpg','l.jpg','m.jpg','o.jpg','p.jpg','q.jpg','r.jpg','s.jpg','t.jpg','u.jpg','v.jpg','w.jpg','x.jpg','y.jpg','z.jpg'
];
const footballImages = [
  'aa.jpg','bb.jpg','cc.jpg','dd.jpg','ee.jpg','ff.jpg','gg.jpg','hh.jpg','iii.jpg','jj.jpg','kk.jpg','ll.jpg'
];
const shuttleImages = [
  'aaa.jpg','bbb.jpg','ccc.jpg','ddd.jpg','eee.jpg','fff.jpg','ggg.jpg','hhh.jpg','iii.jpg','jjj.jpg','kkk.jpg','lll.jpg','mmm.jpg'
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

db.serialize(() => {
  db.each('SELECT id, ground_type FROM grounds', (err, row) => {
    if (err) {
      console.error('Fetch error:', err);
      return;
    }
    const type = (row.ground_type || '').toLowerCase();
    let img;
    if (type.includes('cricket')) img = randomFrom(cricketImages);
    else if (type.includes('football')) img = randomFrom(footballImages);
    else if (type.includes('shuttle')) img = randomFrom(shuttleImages);
    else return; // not a target ground type
    const photoUrl = '/uploads/' + img;
    db.run(
      "INSERT INTO ground_photos (ground_id, photo_url, category) VALUES (?, ?, 'gallery')",
      [row.id, photoUrl],
      e => { if (e) console.error('Insert error for ground', row.id, e); }
    );
  }, finalErr => {
    if (finalErr) console.error('Iteration finished with error:', finalErr);
    else console.log('Gallery images populated for applicable grounds.');
    db.close();
  });
});
