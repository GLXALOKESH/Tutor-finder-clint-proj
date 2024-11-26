# tutor_finder

## Main URL: `http://192.168.0.20:8090/api`

# User Auth

## User/Student/Teacher
#### Method: `POST` `/auth/signup`

### Student (Input JSON Object):


```json
{
  "user_name": "johndoe",
  "email": "johndoe@example.com",
  "password": "password123",
  "account_type": "student",
  "name": "John Doe",
  "gender": "Male",
  "age": 20,
  "village": "Green Valley",
  "district": "Central",
  "state": "StateName",
  "pin": "123456",
  "phone_no": "9876543210"
}
```

### Teacher (Input JSON Object):

```json
{
  "user_name": "john_doe",
  "email": "johndoe@example.com",
  "password": "hashedPassword123",
  "account_type": "teacher",
  "name": "John Doe",
  "gender": "Male",
  "age": 35,
  "subjects": ["Math", "Science", "Geography"],
  "experience": 10,
  "village": "Springfield",
  "district": "Springfield",
  "state": "Illinois",
  "pin": "62701",
  "phone_no": "1234567890",
  "isVerified": false,
  "qualification": "PhD in Education"
}

```
