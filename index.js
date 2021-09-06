const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const userRepo = require('./repositories/users');

const app = express();

app.use(bodyParser.urlencoded({ extended: true}));
app.use(cookieSession({ keys: [''] }));

app.get('/signup', (req, res) => {
  res.send(`
    <div>
    Your ID is: ${req.session.userID}
      <form method="POST">
        <input name="email" placehodler="email" />
        <input name="password" placeholder="password" />
        <input name="passwordConfirmation" placeholder="password confirmation" />
        <button>Sign Up</button>
      </form>
    </div>
  `);
});

// const bodyParser = (req, res, next) => {
//   if (req.method === 'POST') {
//     req.on('data', data => {
//       const parsed = data.toString('utf8').split('&');
//       const formData = {};
//       for (let pair of parsed) {
//         const [key, value] = pair.split('=');
//         formData[key] = value;
//       }
//       req.body = formData;
//       next();
//     });
//   } else {
//     next();
//   }
// };

// app.post('/', bodyParser, (req, res) => {
//   console.log(req.body);
//   res.send('Account created');
// });

app.post('/signup', async (req, res) => {
  const { email, password, passwordConfirmation } = req.body;

  const existingUser = await userRepo.getOneBy({ email });
  if (existingUser) {
    return res.send('Email in use')
  }

  if (password!==passwordConfirmation) {
    return res.send('Passwords must match!')
  }

  const user = await userRepo.create({ email: email, password:password });

  req.session.userID = user.id;

  res.send('Account created');
});

app.get('/signout', (req, res)=> {
  req.session = null;
  res.send('you are successfully signed out!');
});

app.get('/signin', (req, res)=> {
  res.send(`
  <div>
    <form method="POST">
      <input name="email" placehodler="email" />
      <input name="password" placeholder="password" />
      <button>Sign Up</button>
    </form>
  </div>
  `);
});

app.post('/signin', async (req, res)=> {
  const {email, password } = req.body;

  const user = await userRepo.getOneBy({ email });

  if (!user) {
    return res.send('email not found!');
  }
  
  const validPassowrd = await userRepo.comparePasswords(
    user.password,
    password
  );
  if (!validPassowrd) {
    return res.send('passwords don\'t match!');
  }

  req.session.userID = user.id;

  res.send('you are in!!');
});

app.listen(3000, () => {
    console.log('listening!')
});