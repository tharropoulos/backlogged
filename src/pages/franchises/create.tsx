import { type NextPage } from "next";
import { SEO } from "~/components/SEO";
import { CreateFranchiseForm } from "~/components/forms/create-franchise-form";

const CreateFranchisePage: NextPage = () => {
  return (
    <>
      <SEO title="Create Franchise" />
      <div className="container w-3/4">
        <CreateFranchiseForm />
      </div>
    </>
  );
};
export default CreateFranchisePage;
