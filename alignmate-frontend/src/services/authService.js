
// REGISTER
export const registerUser = async (data) => {
  const users = JSON.parse(localStorage.getItem("users")) || [];

  const existingUser = users.find((u) => u.email === data.email);

  if (existingUser) {
    return {
      success: false,
      message: "An account with this email already exists",
    };
  }

  const newUser = {
    id: Date.now().toString(),
    name: data.name,
    email: data.email,
    password: data.password,
  };

  localStorage.setItem("users", JSON.stringify([...users, newUser]));

  return {
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    },
  };
};

// 🔹 LOGIN
export const loginUser = async (data) => {
  const users = JSON.parse(localStorage.getItem("users")) || [];

  const user = users.find(
    (u) => u.email === data.email && u.password === data.password
  );

  if (!user) {
    return {
      success: false,
      message: "Invalid email or password",
    };
  }

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
};

// 🔹 GET CURRENT USER
export const getCurrentUser = () => {
  const stored = localStorage.getItem("currentUser");
  return stored ? JSON.parse(stored) : null;
};

// 🔹 LOGOUT
export const logoutUser = () => {
  localStorage.removeItem("currentUser");
};