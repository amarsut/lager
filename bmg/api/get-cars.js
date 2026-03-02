// api/get-cars.js
export default async function handler(req, res) {
  const API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwaS5ieXRiaWwuY29tIiwic3ViIjoiYXBpLmJ5dGJpbC5jb20vdXNlcnMvYm1nbW90b3JncnVwcCIsImF1ZCI6WyJodHRwczovL2FkbWluLmJ5dGJpbC5jb20iXSwibmJmIjoxNzcyNDY1NDI0LCJpYXQiOjE3NzI0NjU0MjQsImV4cCI6bnVsbCwianRpIjoiMjdmZjk4YzUtNjFiMi00NTA4LWJhODUtNTJkZmI5ODJkNGJhIiwibGltaXQiOi0xLCJzY29wZXMiOnsiZ2V0LnZlaGljbGVzIjoiYm1nbW90b3JncnVwcCJ9fQ.h5khWExjXjaTMUKN9zQnqr0sNkyOEW_uVRbhv5f7630";
  
  try {
    const response = await fetch('https://api.blocket.se/v1/accounts/me/ads', {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` }
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Kunde inte hämta bilar" });
  }
}
