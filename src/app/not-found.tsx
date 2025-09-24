"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeftIcon, HomeIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
  return (
    <section className="bg-primary-bg">
      <div className="container mx-auto min-h-screen px-6 py-12 lg:flex lg:items-center lg:gap-12">
        <div className="w-full lg:w-1/2">
          <p className="text-secondary-text text-sm font-medium">404 error</p>
          <h1 className="text-primary-text mt-3 text-2xl font-semibold md:text-3xl">
            Page not found
          </h1>
          <p className="text-secondary-text mt-4">
            Sorry, the page you are looking for doesn&apos;t exist. Here are
            some helpful links:
          </p>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
            <button
              onClick={() => window.history.back()}
              className="text-primary-text bg-primary-bg hover:bg-secondary-bg flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-6 py-3 transition-colors sm:w-auto"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Go back</span>
            </button>

            <Link
              href="/"
              className="bg-button-info text-form-button-text hover:bg-button-info-hover flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors sm:w-auto"
            >
              <HomeIcon className="h-5 w-5" />
              Take me home
            </Link>
          </div>
        </div>

        <div className="relative mt-12 w-full lg:mt-0 lg:w-1/2">
          <Image
            className="w-full max-w-lg lg:mx-auto"
            src="/assets/images/404.svg"
            alt="404 Error Illustration"
            width={500}
            height={400}
          />
        </div>
      </div>
    </section>
  );
}
