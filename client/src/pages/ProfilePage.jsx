import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import assets from '../assets/assets';

const ProfilePage = () => {

  const [name, setName] = useState("Martin Johnson")
  const [bio, setBio] = useState("Hi everyone, i am using qiuck chat")
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    navigate('/');

  }
  return (
    <div className='min-h-screen bg-cover bg-no-repeat flex items-center justify-center'>
      {/* --------left ----------*/}
      <div className='w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5 p-10 flex-1'>
          <h3 className='text-lg'> Profile Details</h3>
          <label htmlFor="avatar" className='flex items-center gap-3 cursor-pointer'>
            <input onChange={(e) => setSelectedImage(e.target.files[0])} type="file" id='avatar' accept='.png, .jpg, .jpeg' hidden />
            <img src={selectedImage ? URL.createObjectURL(selectedImage) : assets.avatar_icon} className={`w-12 h-12 ${selectedImage && 'rounded-full'}`} alt="" />
            upload profile Image
          </label>
          <input onChange={(e) => setName(e.target.value)} value={name}
           type="text" required placeholder='Your name' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500' />

           <textarea onChange={(e) => setBio(e.target.value)} value={bio}
            required placeholder='write Profile bio' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500' rows={4}></textarea>

            <button type='submit' className='bg-gradient-to-r from-purple-400 to-violet-600 tex-whit p-2 rounded-full text-lg cursor-pointer'>Save</button>
        </form>
        <img src={assets.logo_icon} className='max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10'/>
      </div>
      
    </div>
  )
}

export default ProfilePage
