using Microsoft.AspNetCore.Mvc;
using bankweb.Data;
using bankweb.Models;

namespace bankweb.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }


        [HttpGet]
        public IActionResult GetUsers()
        {
            var users = _context.Users.ToList();

            return Ok(users);
        }


        [HttpPost]
        public IActionResult CreateUser(User user)
        {
            _context.Users.Add(user);
            _context.SaveChanges();

            return Ok(user);
        }
    }
}