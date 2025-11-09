import { Button } from "@/components/ui/button";

const Home = () => {
  return (
    <>
      <h1 className="text-3xl text-center text-blue-500 font-bold">
        ForgeFit
      </h1>
      <div className="flex justify-center items-center"> <Button variant="default" className="bg-blue-500 text-white hover:bg-blue-600">Get Started</Button> </div>
    </>
  );
};

export default Home;