import Navbar from "../../components/Navbar/Navbar";

export default function Home() {

    return (

        <>

            <Navbar />

            <div
                style={{
                    padding: 40,
                    textAlign: "center",
                }}
            >

                <h1>Welcome to Language Memory</h1>

                <p>Learn languages with YouTube</p>

            </div>

        </>

    );
}