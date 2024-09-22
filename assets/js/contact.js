
function send(event){
    event.preventDefault()
    const inputName= document.getElementById("name").value;
    const inputEmail= document.getElementById("email").value;
    const inputPhone= document.getElementById("phone").value;
    const inputSubject= document.getElementById("subject").value;
    const inputMessage = document.getElementById("message").value;
    
    if (!inputName.length) {
        return alert(`Nama tidak boleh kosong!`);
      } else if (!inputEmail.length) {
        return alert(`Email tidak boleh kosong!`);
      } else if (!inputPhone.length) {
        return alert(`Phone Number tidak boleh kosong!`);
      } else if (!inputSubject.length) {
        return alert(`Subject tidak boleh kosong!`);
      } else if (!inputMessage.length) {
        return alert(`Message tidak boleh kosong!`);
      }

      const link = document.createElement("a");
    link.href = `mailto:ikramjundulloh@gmail.com?subject=${inputSubject}&body=Nama: ${inputName}
    Nomor HP: ${inputPhone}
    Email: ${inputEmail}
    Message: ${inputMessage}`;
    
      link.click();
    
      const contact = {
        name: inputName,
        email: inputEmail,
        phoneNumber: inputPhone,
        subject: inputSubject,
        message: inputMessage,
      };
    
      console.log(contact);
    
}