import Navbar from "./components/Navbar/Navbar";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <>
      <Navbar />

      <main style={{ paddingTop: "70px" }}>
        <AppRoutes />
      </main>
    </>
  );
}

export default App;