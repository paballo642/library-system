import { useState, useEffect } from "react";
import "./App.css";

const ADMIN_ID = "574911";
const ADMIN_PASSWORD = "PABALLO19";

function App() {
  // ================= DATA =================
  const [users, setUsers] = useState(() => {
    return JSON.parse(localStorage.getItem("registeredUsers")) || [];
  });
  const [books, setBooks] = useState(() => {
    return JSON.parse(localStorage.getItem("books")) || [];
  });
  const [transactions, setTransactions] = useState(() => {
    return JSON.parse(localStorage.getItem("transactions")) || [];
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("dashboard"); // dashboard | books | transactions | users

  // Login form state
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState("Member");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");

  // Book form state
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookGenre, setBookGenre] = useState("");
  const [bookIsbn, setBookIsbn] = useState("");
  const [bookQuantity, setBookQuantity] = useState("");

  // Transaction form state
  const [selectedBookIndex, setSelectedBookIndex] = useState(0);
  const [transactionType, setTransactionType] = useState("borrow");
  const [transactionQty, setTransactionQty] = useState("");

  // User form state
  const [userName, setUserName] = useState("");
  const [userMembership, setUserMembership] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState("Member");

  // ================= SAVE DATA =================
  useEffect(() => {
    localStorage.setItem("registeredUsers", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("books", JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  // ================= HELPERS =================
  const numbersOnly = (value) => value.replace(/[^0-9]/g, "");

  // ================= LOGIN =================
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginMessage("");

    // Admin login
    if (
      loginId === ADMIN_ID &&
      loginPassword === ADMIN_PASSWORD &&
      loginRole === "Admin"
    ) {
      setCurrentUser({
        name: "Administrator",
        membershipId: ADMIN_ID,
        role: "Admin",
      });
      setPage("dashboard");
      return;
    }

    // Other users
    const user = users.find(
      (u) =>
        u.membershipId === loginId &&
        u.password === loginPassword &&
        u.role === loginRole
    );

    if (!user) {
      setLoginMessage("Invalid Membership ID, Password or Role.");
      return;
    }

    setCurrentUser(user);
    setPage("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginId("");
    setLoginPassword("");
    setLoginRole("Member");
    setLoginMessage("");
  };

  // ================= BOOK ACTIONS =================
  const addBook = (e) => {
    e.preventDefault();
    setBooks([
      ...books,
      {
        title: bookTitle,
        author: bookAuthor,
        genre: bookGenre,
        isbn: bookIsbn,
        quantity: Number(bookQuantity),
      },
    ]);
    setBookTitle("");
    setBookAuthor("");
    setBookGenre("");
    setBookIsbn("");
    setBookQuantity("");
    alert("Book added successfully.");
  };

  const editBook = (index) => {
    const book = books[index];
    const title = prompt("Title:", book.title);
    if (title === null) return;
    const author = prompt("Author:", book.author);
    if (author === null) return;
    const genre = prompt("Genre:", book.genre);
    if (genre === null) return;
    const isbn = prompt("ISBN:", book.isbn);
    if (isbn === null) return;
    const quantity = prompt("Quantity:", book.quantity);
    if (quantity === null) return;

    const updated = [...books];
    updated[index] = {
      title,
      author,
      genre,
      isbn,
      quantity: Number(quantity),
    };
    setBooks(updated);
  };

  const deleteBook = (index) => {
    if (confirm("Delete this book?")) {
      setBooks(books.filter((_, i) => i !== index));
    }
  };

  // ================= TRANSACTION ACTIONS =================
  const recordTransaction = (e) => {
    e.preventDefault();

    if (books.length === 0) {
      alert("There are no books.");
      return;
    }

    const selectedBook = books[Number(selectedBookIndex)];
    const amount = Number(transactionQty);

    if (amount <= 0 || isNaN(amount)) {
      alert("Quantity must be greater than 0.");
      return;
    }

    const updatedBooks = [...books];

    if (transactionType === "add") {
      if (currentUser.role !== "Admin") {
        alert("Only the Administrator can add stock.");
        return;
      }
      updatedBooks[selectedBookIndex] = {
        ...selectedBook,
        quantity: selectedBook.quantity + amount,
      };
      setBooks(updatedBooks);
      setTransactions([
        ...transactions,
        {
          date: new Date().toLocaleString(),
          book: selectedBook.title,
          type: "Add Stock",
          quantity: amount,
          user: currentUser.membershipId,
        },
      ]);
    } else {
      // Borrow
      if (amount > selectedBook.quantity) {
        alert("Not enough copies available.");
        return;
      }
      updatedBooks[selectedBookIndex] = {
        ...selectedBook,
        quantity: selectedBook.quantity - amount,
      };
      setBooks(updatedBooks);
      setTransactions([
        ...transactions,
        {
          date: new Date().toLocaleString(),
          book: selectedBook.title,
          type: "Borrow Book",
          quantity: amount,
          user: currentUser.membershipId,
        },
      ]);
    }

    setTransactionQty("");
    alert("Transaction recorded.");
  };

  const returnBook = (title) => {
    let borrowed = 0;
    let returned = 0;

    transactions.forEach((t) => {
      if (t.user === currentUser.membershipId && t.book === title) {
        if (t.type === "Borrow Book") borrowed += t.quantity;
        if (t.type === "Return Book") returned += t.quantity;
      }
    });

    const stillBorrowed = borrowed - returned;
    if (stillBorrowed <= 0) {
      alert("You have no copies of this book to return.");
      return;
    }

    const amountStr = prompt("How many copies do you want to return?", "1");
    if (amountStr === null) return;
    const amount = Number(amountStr);

    if (amount < 1 || amount > stillBorrowed) {
      alert("Invalid quantity.");
      return;
    }

    const bookIndex = books.findIndex((b) => b.title === title);
    if (bookIndex === -1) {
      alert("Book not found.");
      return;
    }

    const updatedBooks = [...books];
    updatedBooks[bookIndex] = {
      ...books[bookIndex],
      quantity: books[bookIndex].quantity + amount,
    };
    setBooks(updatedBooks);

    setTransactions([
      ...transactions,
      {
        date: new Date().toLocaleString(),
        book: title,
        type: "Return Book",
        quantity: amount,
        user: currentUser.membershipId,
      },
    ]);

    alert("Book returned successfully.");
  };

  const deleteTransaction = (index) => {
    if (confirm("Delete this transaction?")) {
      setTransactions(transactions.filter((_, i) => i !== index));
    }
  };

  // ================= USER ACTIONS =================
  const addUser = (e) => {
    e.preventDefault();
    setUsers([
      ...users,
      {
        name: userName,
        membershipId: userMembership,
        password: userPassword,
        role: userRole,
      },
    ]);
    setUserName("");
    setUserMembership("");
    setUserPassword("");
    setUserRole("Member");
    alert("User added successfully.");
  };

  const editUser = (index) => {
    const user = users[index];
    const name = prompt("Name:", user.name);
    if (name === null) return;
    const membership = prompt("Membership ID:", user.membershipId);
    if (membership === null) return;
    const password = prompt("Password:", user.password);
    if (password === null) return;
    const role = prompt("Role (Member/Librarian):", user.role);
    if (role === null) return;

    const updated = [...users];
    updated[index] = { name, membershipId: membership, password, role };
    setUsers(updated);
  };

  const deleteUser = (index) => {
    if (confirm("Delete this user?")) {
      setUsers(users.filter((_, i) => i !== index));
    }
  };

  // ================= RENDER HELPERS =================
  const PageHeading = ({ title }) => (
    <div className="page-heading">
      <h2>{title}</h2>
    </div>
  );

  // ================= LOGIN SCREEN =================
  if (!currentUser) {
    return (
      <div id="loginSection">
        <div className="login-card">
          <h1>Community Library</h1>
          <h2>Library Management System</h2>

          <form onSubmit={handleLogin}>
            <label>Membership ID</label>
            <input
              type="text"
              placeholder="Enter membership ID"
              value={loginId}
              onChange={(e) => setLoginId(numbersOnly(e.target.value))}
              required
            />

            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />

            <label>Role</label>
            <select
              value={loginRole}
              onChange={(e) => setLoginRole(e.target.value)}
            >
              <option value="Member">Member</option>
              <option value="Librarian">Librarian</option>
              <option value="Admin">Admin</option>
            </select>

            <label className="show-password">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              Show Password
            </label>

            <button type="submit" className="login-button">
              Login
            </button>

            {loginMessage && <p id="loginMessage">{loginMessage}</p>}
          </form>
        </div>
      </div>
    );
  }

  // ================= DASHBOARD =================
  const renderDashboard = () => {
    let available = 0;
    let low = 0;
    books.forEach((book) => {
      available += Number(book.quantity);
      if (Number(book.quantity) < 2) low++;
    });

    return (
      <>
        <PageHeading title="Dashboard" />
        <div id="statistics">
          <div className="stat-card">
            <h3>Total Books</h3>
            <p>{books.length}</p>
          </div>
          <div className="stat-card">
            <h3>Available Copies</h3>
            <p>{available}</p>
          </div>
          <div className="stat-card">
            <h3>Low Stock</h3>
            <p>{low}</p>
          </div>
        </div>

        <div className="content-card dashboard-table-card">
          <h3>Book Availability</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Genre</th>
                  <th>ISBN</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book, i) => (
                  <tr
                    key={i}
                    className={Number(book.quantity) < 2 ? "low-stock" : ""}
                  >
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.genre}</td>
                    <td>{book.isbn}</td>
                    <td>{book.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  // ================= BOOKS =================
  const renderBooks = () => (
    <>
      <PageHeading title="Book Management" />

      {currentUser.role === "Admin" && (
        <div className="book-form-card">
          <form onSubmit={addBook}>
            <div className="form-grid">
              <div className="form-group">
                <label>Title</label>
                <input
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Author</label>
                <input
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Genre</label>
                <input
                  value={bookGenre}
                  onChange={(e) => setBookGenre(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>ISBN</label>
                <input
                  value={bookIsbn}
                  onChange={(e) => setBookIsbn(numbersOnly(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Initial Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={bookQuantity}
                  onChange={(e) => setBookQuantity(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="primary-action">
              Add Book
            </button>
          </form>
        </div>
      )}

      <div className="content-card books-table-card">
        <h3>Books</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Genre</th>
                <th>ISBN</th>
                <th>Quantity</th>
                {currentUser.role === "Admin" && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {books.map((book, i) => (
                <tr
                  key={i}
                  className={Number(book.quantity) < 2 ? "low-stock" : ""}
                >
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.genre}</td>
                  <td>{book.isbn}</td>
                  <td>{book.quantity}</td>
                  {currentUser.role === "Admin" && (
                    <td>
                      <button onClick={() => editBook(i)}>Update</button>
                      <button onClick={() => deleteBook(i)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // ================= TRANSACTIONS =================
  const renderTransactions = () => {
    // Calculate my borrowed books (for Members)
    const myBooks = {};
    transactions.forEach((t) => {
      if (t.user !== currentUser.membershipId) return;
      if (!myBooks[t.book]) myBooks[t.book] = 0;
      if (t.type === "Borrow Book") myBooks[t.book] += t.quantity;
      if (t.type === "Return Book") myBooks[t.book] -= t.quantity;
    });

    return (
      <>
        <PageHeading title="Transactions" />

        {/* My Borrowed Books (Member only) */}
        {currentUser.role === "Member" && (
          <div className="content-card borrowed-books-card">
            <h3>My Borrowed Books</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Borrowed</th>
                    <th>Returned</th>
                    <th>Still Borrowed</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(myBooks).map((title) => {
                    if (myBooks[title] <= 0) return null;

                    let borrowed = 0;
                    let returned = 0;
                    transactions.forEach((t) => {
                      if (
                        t.user === currentUser.membershipId &&
                        t.book === title
                      ) {
                        if (t.type === "Borrow Book") borrowed += t.quantity;
                        if (t.type === "Return Book") returned += t.quantity;
                      }
                    });
                    const stillBorrowed = borrowed - returned;

                    return (
                      <tr key={title}>
                        <td>{title}</td>
                        <td>{borrowed}</td>
                        <td>{returned}</td>
                        <td>{stillBorrowed}</td>
                        <td>
                          <button onClick={() => returnBook(title)}>
                            Return Book
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Record Transaction Form */}
        <div className="content-card transaction-form-card">
          <form onSubmit={recordTransaction}>
            <div className="transaction-form-grid">
              <label>Book</label>
              <select
                value={selectedBookIndex}
                onChange={(e) => setSelectedBookIndex(e.target.value)}
              >
                {books.length === 0 ? (
                  <option value="">No books available</option>
                ) : (
                  books.map((b, i) => (
                    <option key={i} value={i}>
                      {b.title} - Available: {b.quantity}
                    </option>
                  ))
                )}
              </select>

              <label>Transaction Type</label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
              >
                <option value="borrow">Borrow Book</option>
                <option value="add">Add Stock</option>
              </select>

              <label>Quantity</label>
              <input
                type="number"
                min="1"
                placeholder="Quantity"
                value={transactionQty}
                onChange={(e) => setTransactionQty(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="primary-action">
              Record Transaction
            </button>
          </form>
        </div>

        {/* Transaction History */}
        <div className="content-card transaction-history-card">
          <h3>Transaction History</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Book</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>User</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={i}>
                    <td>{t.date}</td>
                    <td>{t.book}</td>
                    <td>{t.type}</td>
                    <td>{t.quantity}</td>
                    <td>{t.user}</td>
                    <td>
                      {currentUser.role === "Admin" ||
                      currentUser.role === "Librarian" ? (
                        <button onClick={() => deleteTransaction(i)}>
                          Delete
                        </button>
                      ) : (
                        "View Only"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  // ================= USERS =================
  const renderUsers = () => (
    <>
      <PageHeading title="User Management" />

      <div className="content-card user-form-card">
        <form onSubmit={addUser}>
          <div className="form-grid">
            <div className="form-group">
              <label>Name</label>
              <input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Membership ID</label>
              <input
                value={userMembership}
                onChange={(e) =>
                  setUserMembership(numbersOnly(e.target.value))
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
              >
                <option value="Member">Member</option>
                <option value="Librarian">Librarian</option>
              </select>
            </div>
          </div>
          <button type="submit" className="primary-action">
            Add User
          </button>
        </form>
      </div>

      <div className="content-card user-table-card">
        <h3>Registered Users</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Membership ID</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={i}>
                  <td>{user.name}</td>
                  <td>{user.membershipId}</td>
                  <td>{user.role}</td>
                  <td>
                    <button onClick={() => editUser(i)}>Update</button>
                    <button onClick={() => deleteUser(i)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // ================= MAIN APPLICATION =================
  return (
    <>
      <header>
        <h1>Community Library Management System</h1>
        <div className="header-user">
          <p>
            {currentUser.name} ({currentUser.role})
          </p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <nav>
        <button onClick={() => setPage("dashboard")}>Dashboard</button>
        <button onClick={() => setPage("books")}>Books</button>
        <button onClick={() => setPage("transactions")}>Transactions</button>
        {currentUser.role === "Admin" && (
          <button onClick={() => setPage("users")}>Users</button>
        )}
      </nav>

      <div id="content">
        {page === "dashboard" && renderDashboard()}
        {page === "books" && renderBooks()}
        {page === "transactions" && renderTransactions()}
        {page === "users" && currentUser.role === "Admin" && renderUsers()}
      </div>
    </>
  );
}

export default App;